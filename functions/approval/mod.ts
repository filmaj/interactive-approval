import { BlockActionsRouter, ViewsRouter } from "deno-slack-sdk/mod.ts";
import { SlackFunction } from "deno-slack-sdk/mod.ts";
import { SlackAPI } from "deno-slack-api/mod.ts";
import { ApprovalFunction } from "./ddefinition.ts";
import {
  renderApprovalCompletedMessage,
  renderApprovalMessage,
  renderApprovalOutcomeStatusMessage,
  renderApprovalViewedMessage,
  renderDenyModalCCPage,
  renderDenyModalMainPage,
  renderDenyModalSurprisePage,
} from "./views.ts";
import { MyEvent } from "../../manifest.ts";

export default SlackFunction(ApprovalFunction,
  async ({ inputs, token, env, event }) => {
    console.log("Top level function event", JSON.stringify(event, null, 2));
    const client = SlackAPI(token, {
      slackApiUrl: env.SLACK_API_URL,
    });

    const resp = await client.chat.postMessage({
      channel: inputs.approval_channel_id,
      blocks: renderApprovalMessage(inputs),
      metadata: {
        event_type: MyEvent,
        event_payload: {
          aBoolean: true
        },
      }
    });

    if (!resp.ok) {
      console.log("Error posting message", resp);
    }

    return {
      completed: false,
    };
  }
).addUnhandledEventHandler((args: any) => {
  console.log("This event was not handled", args);
}).addBlockActionsHandler("deny_request", async ({ body, inputs, token, env }) => {
    console.log("Hello from deny button action handler", JSON.stringify(body, null, 2));
    const client = SlackAPI(token, {
      slackApiUrl: env.SLACK_API_URL,
    });

    const payload = {
      trigger_id: body.interactivity.interactivity_pointer,
      view: renderDenyModalMainPage(inputs, {
        messageTS: body.message.ts,
      }),
    };

    const resp = await client.views.open(payload);
    if (!resp.ok) {
      console.log("error opening main modal view", resp);
    }
  })
  .addBlockActionsHandler("cc_someone", async ({ body, token, env }) => {
    console.log("Hello from CC button action handler", body);
    const client = SlackAPI(token, {
      slackApiUrl: env.SLACK_API_URL,
    });

    const payload = {
      trigger_id: body.interactivity.interactivity_pointer,
      view: renderDenyModalCCPage(body.view.private_metadata),
    };

    const resp = await client.views.push(payload);
    if (!resp.ok) {
      console.log("error opening cc modal view", resp);
    }
  })
  .addBlockActionsHandler("surprise", async ({ body, token, env }) => {
    console.log("Hello from surprise button action handler");
    const client = SlackAPI(token, {
      slackApiUrl: env.SLACK_API_URL,
    });

    const payload = {
      trigger_id: body.interactivity.interactivity_pointer,
      view: renderDenyModalSurprisePage(),
    };

    const resp = await client.views.push(payload);
    if (!resp.ok) {
      console.log("error opening surprise modal view", resp);
    }
  })
  .addBlockActionsHandler("approve_request", async ({ inputs, body, token, env }) => {
    console.log("Hello from approve button action handler", body);
    const client = SlackAPI(token, {
      slackApiUrl: env.SLACK_API_URL,
    });
    const outputs = {
      reviewer: body.user.id,
      approved: true,
      message_ts: body.message.ts,
    };

    const statusMsgResp = await client.chat.postMessage({
      channel: inputs.approval_channel_id,
      thread_ts: outputs.message_ts,
      text: renderApprovalOutcomeStatusMessage(outputs),
    });
    if (!statusMsgResp.ok) {
      console.log("error posting status msg", statusMsgResp);
    }

    // Remove the button from the approval message
    const updateMsgResp = await client.chat.update({
      channel: inputs.approval_channel_id,
      ts: outputs.message_ts,
      blocks: renderApprovalCompletedMessage(
        inputs,
        outputs,
      ),
    });
    if (!updateMsgResp.ok) {
      console.log("error updating msg", updateMsgResp);
    }

    await client.functions.completeSuccess({
      function_execution_id: body.function_data.execution_id,
      outputs,
    });
  }).addViewSubmissionHandler(
    "deny_modal_cc",
    async ({ body, token, env, view, inputs }) => {
      console.log("Hello from CC view submission handler");
      const client = SlackAPI(token, {
        slackApiUrl: env.SLACK_API_URL,
      });
      const { messageTS, update } = JSON.parse(view.private_metadata || "{}");
      const userToNotify = view.state.values?.cc_block?.cc_user?.selected_user;
      console.log(`will notify ${userToNotify} of request`);
      const msgResp = await client.chat.postMessage({
        channel: userToNotify,
        text:
          `<@${inputs.requester_id}> just put in a request for ${inputs.subject} ${
            inputs.details ? `(${inputs.details})` : ""
          }! No good very bad!`,
      });
      if (!msgResp.ok) {
        console.log("Error notifying HR", msgResp.error);
      }
    },
  ).addViewSubmissionHandler("deny_modal_surprise", () => {
    console.log("Hello from surprise view submission handler");
    return {
      response_action: "clear",
    };
  }).addViewSubmissionHandler(
    "deny_modal_main",
    async ({ body, token, env, view, inputs }) => {
      console.log("Hello from main view submission handler", JSON.stringify(body, null, 2));
      const client = SlackAPI(token, {
        slackApiUrl: env.SLACK_API_URL,
      });
      const { messageTS, update } = JSON.parse(view.private_metadata || "{}");

      const reason =
        (view.state.values?.reason_block?.reason_input?.value ?? "")
          .trim();

      const outputs = {
        reviewer: body.user.id,
        approved: false,
        message_ts: messageTS,
        denial_reason: reason,
        remediation: "",
      };

      // Need to provide comments if not approving
      if (!outputs.denial_reason || outputs.denial_reason == "lgtm") {
        return {
          response_action: "errors",
          errors: {
            "reason_block":
              "Please provide an adequate reason for denying the request",
          },
        };
      }

      // Push a new view to ask for remediation
      if (!update) {
        return {
          response_action: "update",
          view: renderDenyModalMainPage(inputs, {
            messageTS: JSON.parse(view.private_metadata || "{}").messageTS,
            update: true,
          }),
        };
      }
      const remediation =
        (view.state.values?.remediation_block?.remediation_input?.value ?? "")
          .trim();
      outputs.remediation = remediation;

      const msgResp = await client.chat.postMessage({
        channel: inputs.approval_channel_id,
        thread_ts: messageTS,
        text: renderApprovalOutcomeStatusMessage(outputs),
      });
      if (!msgResp.ok) {
        console.log("error sending msg", msgResp);
      }

      // Update the original approval request message
      const updateMsgResp = await client.chat.update({
        channel: inputs.approval_channel_id,
        ts: messageTS,
        blocks: renderApprovalCompletedMessage(inputs, outputs),
      });
      if (!updateMsgResp.ok) {
        console.log("error updating msg", updateMsgResp);
      }

      const completeResp = await client.functions.completeSuccess({
        function_execution_id: body.function_data.execution_id,
        outputs,
      });
      if (!completeResp.ok) {
        console.log("error completing fn", completeResp);
      }
    },
  ).addViewClosedHandler(
    "deny_modal_main",
    async ({ inputs, view, body, token, env }) => {
      console.log("Hello from main view closed handler", body);
      if (body.view.callback_id === "deny_modal_main") {
        const userId = body.user.id;
        const { messageTS } = JSON.parse(view.private_metadata || "{}");

        const client = SlackAPI(token, {
          slackApiUrl: env.SLACK_API_URL,
        });

        const msgResp = await client.chat.postMessage({
          channel: inputs.approval_channel_id,
          blocks: renderApprovalViewedMessage(userId),
          thread_ts: messageTS,
        });
        if (!msgResp.ok) {
          console.log("error posting approval viewed message", msgResp);
        }
      }
    },
  );
