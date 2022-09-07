import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { ApprovalFunction } from "../functions/approval/definition.ts";

export const ApprovalWorkflow = DefineWorkflow({
  callback_id: "approval_wf",
  title: "Approval Workflow",
  input_parameters: {
    properties: {
      interaction: {
        type: Schema.slack.types.interactivity,
      },
      approval_channel_id: {
        type: Schema.slack.types.channel_id,
        description: "Approval channel",
      },
    },
    required: ["interaction", "approval_channel_id"],
  },
});

//const step1 = ApprovalWorkflow.addStep(
  //Schema.slack.functions.OpenForm,
  //{
    //title: "Approval Request",
    //submit_label: "Request",
    //description: "Please describe your request",
    //interactivity: ApprovalWorkflow.inputs.interaction,
    //fields: {
      //required: ["subject"],
      //elements: [
        //{
          //name: "subject",
          //title: "Request Subject",
          //type: Schema.types.string,
        //},
        //{
          //name: "details",
          //title: "Additional Details",
          //type: Schema.types.string,
          //description: "Please add any additional details",
          //long: true,
        //},
      //],
    //},
  //},
//);

const step2 = ApprovalWorkflow.addStep(ApprovalFunction, {
  approval_channel_id: ApprovalWorkflow.inputs.approval_channel_id,
  requester_id: ApprovalWorkflow.inputs.interaction.interactor.id,
  subject: 'test',// step1.outputs.fields.subject,
  details: 'test',//step1.outputs.fields.details,
});

// This is just really here to add some checks on using the outputs of the previous step
ApprovalWorkflow.addStep("slack#/functions/send_message", {
  channel_id: ApprovalWorkflow.inputs.approval_channel_id,
  message:
    `<@${ApprovalWorkflow.inputs.interaction.interactor.id}>, your request has been completed.`,
  thread_ts: step2.outputs.message_ts,
});
