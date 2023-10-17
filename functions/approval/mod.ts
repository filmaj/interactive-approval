import { SlackFunction } from "deno-slack-sdk/mod.ts";
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
import { readCSVObjects } from "https://deno.land/x/csv@v0.8.0/mod.ts";

import { MyEvent } from "../../manifest.ts";
// deno-lint-ignore no-explicit-any
const accountCache: any[] = [];

export default SlackFunction(ApprovalFunction,
  async ({ inputs, client, event, team_id, enterprise_id }) => {
    console.log("Top level function event", JSON.stringify(event, null, 2));
    console.log(team_id, enterprise_id);
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
).addUnhandledEventHandler((args) => {
  console.log("This event was not handled", args);
}).addBlockActionsHandler("deny_request", async ({ body, client, inputs, enterprise_id, team_id }) => {
  console.log("Hello from deny button action handler", JSON.stringify(body, null, 2));
  console.log(team_id, enterprise_id);

  const payload = {
    interactivity_pointer: body.interactivity.interactivity_pointer,
    view: renderDenyModalMainPage(inputs, {
      messageTS: body.message?.ts,
    }),
  };
  console.log(JSON.stringify(payload, null, 2));

  const resp = await client.views.open(payload);
  if (!resp.ok) {
    console.log("error opening main modal view", resp);
  }
})
.addBlockActionsHandler("cc_someone", async ({ body, client }) => {
  console.log("Hello from CC button action handler", body);

  const payload = {
    trigger_id: body.interactivity.interactivity_pointer,
    view: renderDenyModalCCPage(body.view.private_metadata),
  };

  const resp = await client.views.push(payload);
  if (!resp.ok) {
    console.log("error opening cc modal view", resp);
  }
})
.addBlockActionsHandler("surprise", async ({ body, client }) => {
  console.log("Hello from surprise button action handler");

  const payload = {
    trigger_id: body.interactivity.interactivity_pointer,
    view: renderDenyModalSurprisePage(),
  };

  const resp = await client.views.push(payload);
  if (!resp.ok) {
    console.log("error opening surprise modal view", resp);
  }
})
.addBlockActionsHandler("approve_request", async ({ inputs, action, body, client, team_id, enterprise_id }) => {
  console.log("Hello from approve button action handler", action);
  console.log(team_id, enterprise_id);
  const outputs = {
    reviewer: body.user.id,
    approved: true,
    message_ts: body.message?.ts,
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
  async ({ client, view, inputs }) => {
    console.log("Hello from CC view submission handler");
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
  async ({ body, client, view, inputs, team_id, enterprise_id }) => {
    console.log("Hello from main view submission handler", JSON.stringify(body, null, 2));
    console.log(team_id, enterprise_id);
    console.log('view state values', view.state.values);
    const { messageTS, update } = JSON.parse(view.private_metadata || "{}");

    const reason =
      (view.state.values?.reason_block?.reason_input?.value ?? "")
        .trim();

    console.log('reason retrieved:', reason);

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
    // Remove the button from the approval message
    const updateMsgResp = await client.chat.update({
      channel: inputs.approval_channel_id,
      ts: outputs.message_ts,
      blocks: renderApprovalCompletedMessage(
        inputs,
        outputs,
      ),
    });

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
  async ({ inputs, view, body, client, team_id, enterprise_id }) => {
    console.log("Hello from main view closed handler", body);
    console.log(team_id, enterprise_id);
    if (body.view.callback_id === "deny_modal_main") {
      const userId = body.user.id;
      const { messageTS } = JSON.parse(view.private_metadata || "{}");

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
).addBlockSuggestionHandler(
  "ext_select_input",
  async ({ body }) => {
    console.log('block suggestion payload', JSON.stringify(body, null, 2));
    const userInput = body.value;
    let st = new Date();
    let et = new Date();
    if (accountCache.length === 0) {
      // TODO: at runtime it won't be clear where static files exists. would need to abstract this to handle different locations in local run vs. deployed
      const localRunPathPrefix = './';
      const deployedPathPrefix = '/var/task/';
      const figureOutPath = (projectPath: string): string => {
        // Little hack to workaround the limitations on ROSI. Lambda's default working directory is usually something like /var/task
        if (Deno.cwd().includes("task")) return `${deployedPathPrefix}/${projectPath}`;
        return `${localRunPathPrefix}/${projectPath}`;
      };
      const f = await Deno.open(figureOutPath('assets/accounts.csv'))
      for await (const obj of readCSVObjects(f)) { accountCache.push(obj) }
      et = new Date();
      console.log(`Loaded ${accountCache.length} accounts in ${et.valueOf() - st.valueOf()}ms`);
    }
    st = new Date();
    const options = accountCache.filter((account) => {
      if (account.account_name.toLowerCase().includes(userInput.toLowerCase())) return true;
      return false
    // TODO: had to return only 10 options at a time, otherwise local run pooped out
    }).slice(0, 10).map((account) => ({
      value: account.account_id,
      text: {type: "plain_text", text: account.account_name }
    }));
    et = new Date();
    console.log(`Filtered ${accountCache.length} accounts to ${options.length} options in ${et.valueOf() - st.valueOf()}ms`);
    console.log('Sneak peek of options:', options.slice(0,3));
    return {
      // TODO: this casting is fkn annoying
      options: options as {value: string, text: { type:"plain_text", text: string }}[]
    };
  }
);
