import { DefineFunction, Schema } from "deno-slack-sdk/mod.ts";
export const ApprovalFunction = DefineFunction({
  callback_id: "review_approval",
  title: "Approval",
  description: "Get approval for a request",
  source_file: "functions/approval/mod.ts",
  input_parameters: {
    properties: {
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
      reviewer: {
        type: Schema.slack.types.user_id,
        description: "Reviewer",
      },
      message_ts: {
        type: Schema.types.string,
        description: "Request Message TS",
      },
      denial_reason: {
        type: Schema.types.string,
        description: "Reason for denying request",
      },
      remediation: {
        type: Schema.types.string,
        description: "What to do instead",
      },
    },
    required: ["approved", "reviewer", "message_ts"],
  },
});
