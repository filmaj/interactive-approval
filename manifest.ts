import {
  DefineFunction,
  // DefineWorkflow,
  Manifest,
  Schema,
} from "deno-slack-sdk/mod.ts";

export const ApprovalFunction = DefineFunction({
  callback_id: "approval",
  title: "Approval",
  description: "Get approval for a request",
  source_file: "functions/approval.ts",
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
        description: "Details",
      },
    },
    required: ["requester_id", "approval_channel_id", "subject", "details"],
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

// const ApprovalWorkflow = DefineWorkflow({
//   callback_id: "approval_wf",
//   title: "Approval Workflow",
//   input_parameters: {
//     properties: {
//       requester_id: {
//         type: Schema.slack.types.user_id,
//         description: "Requester",
//       },
//       approval_channel_id: {
//         type: Schema.slack.types.channel_id,
//         description: "Approval channel",
//       },
//       subject: {
//         type: Schema.types.string,
//         description: "Subject",
//       },
//       details: {
//         type: Schema.types.string,
//         description: "Details",
//       },
//     },
//     required: ["requester_id", "approval_channel_id", "subject", "details"],
//   },
// });

// const step1 = ApprovalWorkflow.addStep(ApprovalFunction, {
//   approval_channel_id: ApprovalWorkflow.inputs.approval_channel_id,
//   requester_id: ApprovalWorkflow.inputs.requester_id,
//   details: ApprovalWorkflow.inputs.details,
//   subject: ApprovalWorkflow.inputs.subject,
// });

// ApprovalWorkflow.addStep("slack#/functions/send_message", {
//   channel: ApprovalWorkflow.inputs.approval_channel_id,
//   message: `Approval response from <@${step1.outputs.reviewer}>
//   Approved Status: ${step1.outputs.approved}
//   Comments: ${step1.outputs.comments}
//   `,
// });

export default Manifest({
  name: "interactive-approval",
  description: "Appring allthethings",
  icon: "assets/icon.png",
  functions: [ApprovalFunction],
  outgoingDomains: [],
  botScopes: ["commands", "chat:write", "chat:write.public"],
});
