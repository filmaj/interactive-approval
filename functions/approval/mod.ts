import { BlockActionsRouter, ViewsRouter } from "deno-slack-sdk/mod.ts";
import type { SlackFunctionHandler } from "deno-slack-sdk/types.ts";
import { SlackAPI } from "deno-slack-api/mod.ts";
import { ApprovalFunction } from "./definition.ts";
import {
  renderApprovalCompletedMessage,
  renderApprovalMessage,
  renderApprovalOutcomeStatusMessage,
  renderApprovalViewedMessage,
  renderDenyModalCCPage,
  renderDenyModalMainPage,
  renderDenyModalSurprisePage,
} from "./views.ts";

const approval: SlackFunctionHandler<typeof ApprovalFunction.definition> =
  async ({ inputs, token, env, event }) => {
    console.log("Top level function event", JSON.stringify(event, null, 2));
    const client = SlackAPI(token, {
      slackApiUrl: env.SLACK_API_URL,
    });

    const resp = await client.chat.postMessage({
      channel: inputs.approval_channel_id,
      blocks: renderApprovalMessage(inputs),
    });

    if (!resp.ok) {
      console.log("Error posting message", resp);
    }

    return {
      completed: false,
    };
  };

export default approval;
// Little test variable to inspect what the router returns, seems like `addHandler` returns an instance of ActionsRouter
// while `BlockActionsRouter()` returns the expected `BlockActionHandler` 
const test = BlockActionsRouter(ApprovalFunction).addHandler("test", async (ctx) => { console.log(ctx.action); });

export const blockActions = BlockActionsRouter(ApprovalFunction)
  .addHandler("deny_request", async ({ body, inputs, token, env }) => {
    console.log("action handler arg: body", JSON.stringify(body, null, 2));
    const client = SlackAPI(token, {
      slackApiUrl: env.SLACK_API_URL,
    });

    const payload = {
      trigger_id: body.trigger_id,
      view: renderDenyModalMainPage(inputs, {
        messageTS: body.message.ts,
      }),
    };

    const resp = await client.views.open(payload);
    if (!resp.ok) {
      console.log("error opening main modal view", resp);
    }
  })
  .addHandler("cc_someone", async ({ body, token, env }) => {
    const client = SlackAPI(token, {
      slackApiUrl: env.SLACK_API_URL,
    });

    const payload = {
      trigger_id: body.trigger_id,
      view: renderDenyModalCCPage(body.view.private_metadata),
    };

    const resp = await client.views.push(payload);
    if (!resp.ok) {
      console.log("error opening cc modal view", resp);
    }
  })
  .addHandler("surprise", async ({ body, token, env }) => {
    const client = SlackAPI(token, {
      slackApiUrl: env.SLACK_API_URL,
    });

    const payload = {
      trigger_id: body.trigger_id,
      view: renderDenyModalSurprisePage(),
    };

    const resp = await client.views.push(payload);
    if (!resp.ok) {
      console.log("error opening surprise modal view", resp);
    }
  })
  .addHandler("approve_request", async ({ inputs, body, token, env }) => {
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
  });

/*
export const viewSubmission = async (
  { body, view, inputs, token, env }: any,
) => {
*/
export const { viewSubmission, viewClosed } = ViewsRouter(ApprovalFunction)
  .addSubmissionHandler(
    "deny_modal_cc",
    async ({ body, token, env, view, inputs }) => {
      console.log("cc view handler arg: body", JSON.stringify(body, null, 2));
      const client = SlackAPI(token, {
        slackApiUrl: env.SLACK_API_URL,
      });
      const { messageTS, update } = JSON.parse(view.private_metadata);
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
  )
  .addSubmissionHandler("deny_modal_surprise", () => {
    return {
      response_action: "clear",
    };
  })
  .addSubmissionHandler(
    "deny_modal_main",
    async ({ body, token, env, view, inputs }) => {
      const client = SlackAPI(token, {
        slackApiUrl: env.SLACK_API_URL,
      });
      const { messageTS, update } = JSON.parse(view.private_metadata);

      const reason =
        (view.state.values?.reason_block?.reason_input?.value ?? "")
          .trim();

      const outputs = {
        reviewer: body.user.id,
        approved: false,
        message_ts: messageTS,
        denial_reason: reason,
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
            messageTS: JSON.parse(view.private_metadata).messageTS,
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
  )
  .addClosedHandler(
    "deny_modal_main",
    async ({ inputs, view, body, token, env }) => {
      console.log(
        "view closed handler arg: body",
        JSON.stringify(body, null, 2),
      );
      if (body.view.callback_id === "deny_modal_main") {
        const userId = body.user.id;
        const { messageTS } = JSON.parse(view.private_metadata);

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
