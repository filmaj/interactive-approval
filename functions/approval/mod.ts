import { BlockActionsRouter } from "deno-slack-sdk/mod.ts";
import type { SlackFunctionHandler } from "deno-slack-sdk/types.ts";
import { SlackAPI } from "deno-slack-api/mod.ts";
import { ApprovalFunction } from "./definition.ts";
import {
  renderApprovalCompletedMessage,
  renderApprovalMessage,
  renderApprovalOutcomeStatusMessage,
  renderApprovalViewedMessage,
  renderModal,
} from "./views.ts";

const approval: SlackFunctionHandler<typeof ApprovalFunction.definition> =
  async ({ inputs, token, env }) => {
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

export const blockActions = BlockActionsRouter(ApprovalFunction)
  .addHandler("deny_request", async ({ body, inputs, token, env }) => {
    const client = SlackAPI(token, {
      slackApiUrl: env.SLACK_API_URL,
    });

    const payload = {
      trigger_id: body.trigger_id,
      view: renderModal(inputs, {
        messageTS: body.message.ts,
      }),
    };

    const resp = await client.views.open(payload);
    if (!resp.ok) {
      console.log("error opening modal", resp);
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

export const viewSubmission = async (
  { body, view, inputs, token, env }: any,
) => {
  if (view.callback_id === "approval_modal") {
    const { messageTS } = JSON.parse(view.private_metadata);

    const reason = (view.state.values?.reason_block?.reason_input?.value ?? "")
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

    const client = SlackAPI(token, {
      slackApiUrl: env.SLACK_API_URL,
    });

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
  }
};

export const viewClosed = async ({ inputs, view, body, token, env }: any) => {
  if (body.view.callback_id === "approval_modal") {
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
};
