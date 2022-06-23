export const renderApprovalMessage = (inputs: any, state: any) => {
  const blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `A new request has been submitted by <@${inputs.requester_id}>`,
      },
      accessory: {
        type: "button",
        text: {
          type: "plain_text",
          text: "Review for Approval",
          emoji: true,
        },
        value: JSON.stringify(state),
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
  ];
  return blocks;
};

export const renderApprovalCompletedMessage = (inputs: any, outputs: any) => {
  const blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `A new request has been submitted by <@${inputs.requester_id}>`,
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `${
            outputs.approved ? " :white_check_mark: Approved" : ":x: Denied"
          } by <@${outputs.reviewer}>`,
        },
      ],
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
  ];
  return blocks;
};

export const renderApprovalViewedMessage = (viewerId: string) => {
  const blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          `<@${viewerId}> viewed the approval, but noped out of it for now :woman-gesturing-no:`,
      },
    },
  ];
  return blocks;
};

export const renderModal = (inputs: any, state: any) => {
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
        optional: true,
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
    private_metadata: JSON.stringify(state),
    notify_on_close: true,
    type: "modal",
  };
};
