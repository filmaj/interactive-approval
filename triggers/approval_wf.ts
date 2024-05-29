/** This file was autogenerated on Thu Sep 29 2022. **/
import { Trigger } from "deno-slack-api/types.ts";
import ApprovalWorkflow from "../workflows/approval.ts";

/**
* Triggers determine when Workflows are executed. A trigger
* file describes a scenario in which a workflow should be run,
* such as a user pressing a button or when a specific event occurs.
* https://api.slack.com/future/triggers
*/
const approvalWfTrigger: Trigger<typeof ApprovalWorkflow.definition> = {
  type: "shortcut",
  name: "approval_wf trigger",
  description: "",
  workflow: "#/workflows/approval_wf",
  inputs: {
    interaction: {
      value: "{{data.interactivity}}",
    },
    approval_channel_id: {
      value: "{{data.channel_id}}"
    }
  },
};

export default approvalWfTrigger; 
