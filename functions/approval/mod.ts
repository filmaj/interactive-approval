import type { SlackFunctionHandler } from "deno-slack-sdk/types.ts";
import { SlackAPI } from "deno-slack-api/mod.ts";
import type { ApprovalFunction } from "../../manifest.ts";
import {
  renderApprovalCompletedMessage,
  renderApprovalMessage,
  renderModal,
} from "./views.ts";

const approval: SlackFunctionHandler<typeof ApprovalFunction.definition> =
  async (
    { inputs, token, event },
  ) => {
    const client = SlackAPI(token);

    // TODO: This is the bit that is burdensome to pass around as a developer
    const state = {
      inputs,
      functionExecutionId: event.function_execution_id,
    };

    await client.chat.postMessage({
      channel: inputs.approval_channel_id,
      blocks: renderApprovalMessage(inputs, state),
    });

    return await {
      completed: false,
      error: "",
    };
  };

export default approval;

// let's assume actions is a single fn handler for any block actions your function receives
// adding a routing layer to it should be possible in the sdk, i.e. route handlers by block/action id
export const actions = async ({ action, body, token }: any) => {
  console.log("approval actions handler", action.action_id, body);
  if (action.action_id === "review_approval") {
    const state = JSON.parse(action.value as string);

    // Need to pass message ts along so we can remove the button once approval is complete
    const messageTS = body.message.ts;

    const client = SlackAPI(token);

    const payload = {
      trigger_id: body.trigger_id,
      view: renderModal(state.inputs, { ...state, messageTS }),
    };
    console.log("modal payload", payload);

    const resp = await client.views.open(payload);
    if (!resp.ok) {
      console.log("error opening modal", resp);
    }
  }
};

// Similarly to actions here, single fn export for all view subbmissions for this fn
export const viewSubmissions = async ({ body, token }: any) => {
  if (body.view.callback_id === "approval_modal") {
    const view = body.view;
    const metadata = JSON.parse(view.private_metadata);

    console.log(JSON.stringify(view.state.values, null, 2));

    // parse out view input values
    const approved = (view.state.values?.approve_deny_block?.approve_deny_radios
      ?.selected_option?.value ?? "false") === "true";

    const comments =
      (view.state.values?.comments_block?.comments_input?.value ?? "");

    const outputs = {
      reviewer: body.user.id,
      approved,
      comments,
    };

    // Need to provide comments if not approving
    if (!outputs.approved && !outputs.comments) {
      return {
        response_action: "errors",
        errors: {
          "comments_block": "Please provide a reason for denying the request",
        },
      };
    }

    const client = SlackAPI(token);

    // Adding this in to make it easy to see outputs from this function for now
    const msgResp = await client.chat.postMessage({
      channel: metadata.inputs.approval_channel_id,
      thread_ts: metadata.messageTS,
      text: `Request was ${
        outputs.approved ? "approved" : "denied"
      } by <@${outputs.reviewer}>\n${
        outputs.comments ? `>${outputs.comments}` : ""
      }`,
    });
    if (!msgResp.ok) {
      console.log("error sending msg", msgResp);
    }

    // Remove the button from the approval message
    const updateMsgResp = await client.chat.update({
      channel: metadata.inputs.approval_channel_id,
      ts: metadata.messageTS,
      blocks: renderApprovalCompletedMessage(metadata.inputs, outputs),
    });
    if (!updateMsgResp.ok) {
      console.log("error updating msg", updateMsgResp);
    }

    await client.functions.completeSuccess({
      function_execution_id: metadata.functionExecutionId,
      outputs,
    });
  }
};
