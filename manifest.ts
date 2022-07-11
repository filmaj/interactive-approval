import { DefineWorkflow, Manifest, Schema } from "deno-slack-sdk/mod.ts";
import { ApprovalFunction } from "./functions/approval/definition.ts";

const ApprovalWorkflow = DefineWorkflow({
  callback_id: "approval_wf",
  title: "Approval Workflow",
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
});

const step1 = ApprovalWorkflow.addStep(ApprovalFunction, {
  approval_channel_id: ApprovalWorkflow.inputs.approval_channel_id,
  requester_id: ApprovalWorkflow.inputs.requester_id,
  details: ApprovalWorkflow.inputs.details,
  subject: ApprovalWorkflow.inputs.subject,
});

ApprovalWorkflow.addStep("slack#/functions/send_message", {
  channel_id: ApprovalWorkflow.inputs.approval_channel_id,
  message: `workflow is dun`,
  thread_ts: step1.outputs.message_ts,
});

export default Manifest({
  name: "interactive-approval",
  description: "Appring allthethings",
  icon: "assets/icon.png",
  functions: [ApprovalFunction],
  workflows: [ApprovalWorkflow],
  outgoingDomains: [],
  botScopes: ["commands", "chat:write", "chat:write.public"],
});
