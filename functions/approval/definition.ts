import { DefineFunction, Schema } from "deno-slack-sdk/mod.ts";

export const ApprovalFunction = DefineFunction({
  callback_id: "approval",
  title: "Approval",
  description: "Get approval for a request",
  source_file: "functions/approval/mod.ts",
  input_parameters: {
    properties: {
      dtest: {
        type: "slack#/types/date",
      },
      requester_id: {
        type: Schema.slack.types.user_id,
        description: "Requester",
      },
      approval_channel_id: {
        type: Schema.slack.types.channel_id,
        description: "Approval channel",
      },
      subject: {
        type: Schema.types.string,
        description: "Subject",
      },
      details: {
        type: Schema.types.string,
        description: "Details Updated",
      },
    },
    required: [
      "requester_id",
      "approval_channel_id",
      "subject",
      "details",
    ],
  },
  output_parameters: {
    properties: {
      approved: {
        type: Schema.types.boolean,
        description: "Approved",
      },
      comments: {
        type: Schema.types.string,
        description: "Comments",
      },
      reviewer: {
        type: Schema.slack.types.user_id,
        description: "Reviewer",
      },
    },
    required: ["approved", "comments", "reviewer"],
  },
});
