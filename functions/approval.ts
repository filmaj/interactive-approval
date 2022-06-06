import type { SlackFunctionHandler } from "deno-slack-sdk/types.ts";
import { SlackAPI } from "deno-slack-api/mod.ts";
import type { ApprovalFunction } from "../manifest.ts";

const approval: SlackFunctionHandler<typeof ApprovalFunction.definition> =
  async (
    { inputs, token, event },
  ) => {
    const client = SlackAPI(token);

    // TODO: This is the bit that is burdensome to pass around as a developer
    const encodedState = JSON.stringify({
      inputs,
      functionExecutionId: event.function_execution_id,
    });

    await client.chat.postMessage({
      channel: inputs.approval_channel_id,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text:
              `A new request has been submitted by <@${inputs.requester_id}>`,
          },
          accessory: {
            type: "button",
            text: {
              type: "plain_text",
              text: "Review for Approval",
              emoji: true,
            },
            value: encodedState,
            action_id: "review_approval",
          },
        },
        {
          type: "divider",
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Subject:* ${inputs.subject}`,
          },
        },
      ],
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
  console.log("approval actions handler", action.action_id);
  if (action.action_id === "review_approval") {
    const state = JSON.parse(action.value as string);

    const client = SlackAPI(token);

    const payload = {
      trigger_id: body.trigger_id,
      view: renderModal(state.inputs, state),
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

    // parse out view input values
    const approved = (view.state.values?.approve_deny_block?.approve_deny_radios
      ?.selected_option ?? "false") === "true";

    const comments =
      (view.state.values?.comments_block?.comments_input?.value ?? "");

    const outputs = {
      reviewer: body.user.id,
      approved,
      comments,
    };

    const client = SlackAPI(token);

    // Adding this in to make it easy to see outputs from this function for now
    const msgResp = await client.chat.postMessage({
      channel: metadata.inputs.approval_channel_id,
      text: `
  Approval response from <@${outputs.reviewer}>
  Approved Status: ${outputs.approved}
  Comments: ${outputs.comments}`,
    });
    if (!msgResp.ok) {
      console.log("error sending msg", msgResp);
    }

    await client.functions.completeSuccess({
      function_execution_id: metadata.functionExecutionId,
      outputs,
    });
  }
};

const renderModal = (inputs: any, state: any) => {
  return {
    "callback_id": "approval_modal",
    title: {
      type: "plain_text",
      text: "Review Approval Request",
    },
    submit: {
      type: "plain_text",
      text: "Submit",
    },
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `A new request from <@${inputs.requester_id}>`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Subject:* ${inputs.subject}`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Details:* ${inputs.details}`,
        },
      },
      {
        type: "divider",
      },
      {
        type: "section",
        block_id: "approve_deny_block",
        text: {
          type: "mrkdwn",
          text: "Please approve or deny the request by indicating below",
        },
        accessory: {
          type: "radio_buttons",
          options: [
            {
              text: {
                type: "mrkdwn",
                text: "*Approved*",
              },
              value: "true",
            },
            {
              text: {
                type: "mrkdwn",
                text: "*Denied*",
              },
              value: "false",
            },
          ],
          action_id: "approve_deny_radios",
        },
      },
      {
        type: "input",
        block_id: "comments_block",
        element: {
          type: "plain_text_input",
          action_id: "comments_input",
          multiline: true,
          placeholder: {
            type: "plain_text",
            text: "Enter comments here",
          },
        },
        label: {
          type: "plain_text",
          text: "Comments",
        },
        hint: {
          type: "plain_text",
          text: "These comments will be shared with the requestor",
        },
      },
    ],
    "private_metadata": JSON.stringify(state),
    type: "modal",
  };
};
