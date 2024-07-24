import { Trigger } from "deno-slack-sdk/types.ts";
import ApprovalWorkflow from "../workflows/approval.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";

const linkTrigger: Trigger<typeof ApprovalWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "Approval Workflow",
  description: "Trigger an interactive approval flow",
  workflow: `#/workflows/${ApprovalWorkflow.definition.callback_id}`,
  inputs: {
    interaction: {
      value: TriggerContextData.Shortcut.interactivity,
    },
    approval_channel_id: {
      value: TriggerContextData.Shortcut.channel_id,
    },
  },
};

export default linkTrigger;
