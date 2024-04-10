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
    inputs.details
      ? {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Details:* ${inputs.details}`,
        },
      }
      : null,
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
  ].filter(Boolean);
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
  }\n${
    outputs.remediation ? `>${outputs.remediation}` : ""
  }`;
};

/**
 * @description Renders a modal view with a form the denier can fill out with denial reasons
 */
export const renderDenyModalMainPage = (inputs: any, metadata: any) => {
  return {
    "callback_id": "deny_modal_main",
    title: {
      type: "plain_text",
      text: "Deny Request",
    },
    submit: {
      type: "plain_text",
      text: "Next",
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
      {
        type: "input",
        block_id: "ext_select_block",
        optional: true,
        element: {
          type: "external_select",
          action_id: "ext_select_input",
          placeholder: {
            type: "plain_text",
            text: "Search for an account",
          },
        },
        label: {
          type: "plain_text",
          text: "Block Suggestions reading a bundled 2MB CSV File",
        },
      },
      {
        type: "input",
        block_id: "multiselect",
        optional: true,
        label: {
          type: "plain_text",
          text: "Optional MultiSelect test",
        },
        element: {
          type: "multi_static_select",
          action_id: "ms_select_input",
          placeholder: {
            type: "plain_text",
            text: "Search for a colour",
          },
          options: [{
            "text": {
                "type": "plain_text",
                "text": "Red"
            },
            "value": "red"
          }, {
            "text": {
                "type": "plain_text",
                "text": "Green"
            },
            "value": "green"
          }],
        },
      },
      metadata.update ? {
        type: "input",
        block_id: "remediation_block",
        optional: true,
        element: {
          type: "plain_text_input",
          action_id: "remediation_input",
          multiline: true,
          placeholder: {
            type: "plain_text",
            text: "Optionally provide a suggested remediation",
          },
        },
        label: {
          type: "plain_text",
          text: "Remediation",
        },
        hint: {
          type: "plain_text",
          text: "Whoops! Sorry, forgot about this field!",
        },
      } : {
        type: "divider",
      },
      {
        "type": "actions",
        "elements": [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "CC Someone on Response?",
            },
            action_id: "cc_someone",
            style: "danger",
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Surprise!",
            },
            action_id: "surprise",
            style: "danger",
          },
        ],
      },
    ],
    notify_on_close: true,
    private_metadata: JSON.stringify(metadata),
    type: "modal",
  };
};

export const renderDenyModalCCPage = (metadata: any) => {
  return {
    "callback_id": "deny_modal_cc",
    title: {
      type: "plain_text",
      text: "CC Someone",
    },
    submit: {
      type: "plain_text",
      text: "Notify",
    },
    blocks: [
      {
        type: "input",
        block_id: "cc_block",
        element: {
          type: "users_select",
          action_id: "cc_user",
          placeholder: {
            type: "plain_text",
            text: "Someone",
          },
        },
        label: {
          type: "plain_text",
          text: "Whom should we forward this terrible request to?",
        },
        hint: {
          type: "plain_text",
          text: "You probably want to notify HR",
        },
      },
    ],
    private_metadata: metadata,
    type: "modal",
  };
};

export const renderDenyModalSurprisePage = () => {
  return {
    "callback_id": "deny_modal_surprise",
    title: {
      type: "plain_text",
      text: "Surprise!",
    },
    submit: {
      type: "plain_text",
      text: "Clear",
    },
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `This section does nothing but clear the view stack.`,
        },
      },
    ],
    type: "modal",
    private_metadata: "{}",
  };
};
