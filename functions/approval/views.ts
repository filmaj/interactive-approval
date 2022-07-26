export const renderApprovalMessage = (inputs: any) => {
  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `A new request has been submitted`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*From:* <@${inputs.requester_id}>`,
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
      "type": "actions",
      "elements": [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Approve",
          },
          action_id: "approve_request",
          style: "primary",
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Deny",
          },
          action_id: "deny_request",
          style: "danger",
        },
      ],
    },
  ];
  return blocks;
};

export const renderApprovalCompletedMessage = (inputs: any, outputs: any) => {
  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `A new request has been submitted`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*From:* <@${inputs.requester_id}>`,
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

export const renderApprovalOutcomeStatusMessage = (outputs: any) => {
  return `Request was ${
    outputs.approved ? "approved" : "denied"
  } by <@${outputs.reviewer}>\n${
    outputs.denial_reason ? `>${outputs.denial_reason}` : ""
  }`;
};

export const renderModal = (inputs: any, metadata: any) => {
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
        type: "input",
        block_id: "reason_block",
        optional: true,
        element: {
          type: "plain_text_input",
          action_id: "reason_input",
          multiline: true,
          placeholder: {
            type: "plain_text",
            text: "Please provide a reason for denying the request",
          },
        },
        label: {
          type: "plain_text",
          text: "Reason",
        },
        hint: {
          type: "plain_text",
          text: "These comments will be shared with the requestor",
        },
      },
    ],
    notify_on_close: true,
    private_metadata: JSON.stringify(metadata),
    type: "modal",
  };
};
