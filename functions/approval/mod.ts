import type { SlackFunctionHandler } from "deno-slack-sdk/types.ts";
import { SlackAPI } from "deno-slack-api/mod.ts";
import type { ApprovalFunction } from "./definition.ts";
import {
  renderApprovalCompletedMessage,
  renderApprovalMessage,
} from "./views.ts";

const approval: SlackFunctionHandler<typeof ApprovalFunction.definition> =
  async ({ inputs, token, env }) => {
    const client = SlackAPI(token, {
      slackApiUrl: env.SLACK_API_URL,
    });

    try {
      const resp = await client.chat.postMessage({
        channel: inputs.approval_channel_id,
        blocks: renderApprovalMessage(inputs),
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

// Raw handler w/o typing - the SDK will provide this layer and types
export const blockActions = async (
  { action, body, inputs, token, env }: any,
) => {
  if (["approve_request", "deny_request"].includes(action.action_id)) {
    const client = SlackAPI(token, {
      slackApiUrl: env.SLACK_API_URL,
    });

    const outputs = {
      reviewer: body.user.id,
      approved: action.action_id === "approve_request",
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

    await client.functions.completeSuccess({
      function_execution_id: body.function_data.execution_id,
      outputs,
    });
  }
};
