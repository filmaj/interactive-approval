import type { SlackFunctionHandler } from "deno-slack-sdk/types.ts";
import { SlackAPI } from "deno-slack-api/mod.ts";
import type { ApprovalFunction } from "./definition.ts";
import {
  renderApprovalCompletedMessage,
  renderApprovalMessage,
  renderApprovalViewedMessage,
  renderModal,
} from "./views.ts";

// TODO: would be great to expose a type that provides the runtime inputs
type Inputs = {
  requester_id: string;
  approval_channel_id: string;
  subject: string;
  details: string;
};

type Metadata = {
  inputs: Inputs;
  messageTS: string;
  functionExecutionId: string;
};

const approval: SlackFunctionHandler<typeof ApprovalFunction.definition> =
  async (
    { inputs, token, event, env },
  ) => {
    console.log("token in fn", token);
    console.log("inputs in fn", JSON.stringify(inputs, null, 2));
    const client = SlackAPI(token, {
      slackApiUrl: env.SLACK_API_URL,
    });

    // TODO: This is the bit that is burdensome to pass around as a developer
    const state = {
      inputs,
      functionExecutionId: event.function_execution_id,
    };

    try {
      const resp = await client.chat.postMessage({
        channel: inputs.approval_channel_id,
        blocks: renderApprovalMessage(inputs, state),
      });

      if (!resp.ok) {
        console.log("Error posting message", resp);
      }
    } catch (e) {
      console.log("Error posting message", e);
    }

    return {
      completed: false,
    };
  };

export default approval;

// let's assume actions is a single fn handler for any block actions your function receives
// adding a routing layer to it should be possible in the sdk, i.e. route handlers by block/action id
export const blockActions = async (
  { action, body, inputs, token, env }: any,
) => {
  console.log("approval actions handler", action.action_id, body);
  console.log("token", token);
  if (action.action_id === "review_approval") {
    const state = JSON.parse(action.value as string);

    // Need to pass message ts along so we can remove the button once approval is complete
    // const messageTS = body.message.ts;

    const client = SlackAPI(token, {
      slackApiUrl: env.SLACK_API_URL,
    });

    const outputs = {
      reviewer: body.user.id,
      approved: true,
      comments: "",
      message_ts: body.message.ts,
    };

    // Remove the button from the approval message
    const updateMsgResp = await client.chat.update({
      channel: body.function_data.inputs.approval_channel_id,
      ts: outputs.message_ts,
      blocks: renderApprovalCompletedMessage(
        body.function_data.inputs,
        outputs,
      ),
    });
    if (!updateMsgResp.ok) {
      console.log("error updating msg", updateMsgResp);
    }

    // Bailing out early and completing function for now
    await client.functions.completeSuccess({
      function_execution_id: body.function_data.execution_id,
      outputs,
    });
    return;

    // const payload = {
    //   trigger_id: body.trigger_id,
    //   view: renderModal(state.inputs, {
    //     ...state,
    //     messageTS: outputs.message_ts,
    //   }),
    // };
    // console.log("modal payload", payload);

    // const resp = await client.views.open(payload);
    // if (!resp.ok) {
    //   console.log("error opening modal", resp);
    // }
  }
};

export const viewClosed = async ({ view, body, token }: any) => {
  console.log("viewClosed handler");
  if (body.view.callback_id === "approval_modal") {
    const view = body.view;
    const userId = body.user.id;
    const metadata = JSON.parse(view.private_metadata) as Metadata;
    const { messageTS, inputs } = metadata;

    const client = SlackAPI(token);
    const msgResp = await client.chat.postMessage({
      channel: inputs.approval_channel_id,
      blocks: renderApprovalViewedMessage(userId),
      thread_ts: messageTS,
    });
    if (!msgResp.ok) {
      console.log("error posting approval viewed message", msgResp);
    }
  }
};

// Similarly to actions here, single fn export for all view subbmissions for this fn
export const viewSubmission = async ({ body, token }: any) => {
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
