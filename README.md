# Platform 2.0 Interactive Function Example

This app includes a single `approval` function that is meant as an example of how we can implement an app with function-specific interactivity handlers, i.e. `block_actions`, `view_submission` and `view_closed` handlers. Currently the function sends a message with approve and deny buttons, and completes the function, as well as updates the message once a button is clicked.

In the future it will inject a modal w/ collecting more review details as part of the approval flow.

## Testing Instructions

This requires a new version of the `deno-slack-runtime` that supports function interactivity payloads as well as JIT tokens being enabled. To fully test the runtime in a deployed lambda environment we need to use a dev instance of webapp that's been configured to run that version.

A dev instance is setup, as well as an app and channel in the dev `beagoodhost` workspace to more easily test interactivity.

1. Join `beagoodhost` (@berad can send an invite if needed) and hop into the `#function-interactivity-testing` channel - https://app.dev1407.slack.com/client/T012509CP9R/C0140H2881Y. Using `dev1407` is important here as it's the dev instance setup with the new lambda arn layer that uses the new runtime.
2. There are two pinned shortcuts in the bookmark bar - `Deployed Laptop Request` and `LocalDev Laptop Request`. Running the Deployed flavor should work out of the box (hopefully it's obvious how to proceed once it runs), so give it a go. The LocalDev flavor needs @berad to startup the app in local dev mode to test, so feel free to ping him.

To grab the code and run this yourself should be pretty straight-forward as well.

1. Check this repo out.
2. Deploy the app to a dev workspace that is setup for link triggers to work. `beagoodhost` is a good candidate that has the right toggles setup: `hermes deploy --apihost=https://dev1407.slack.com`
3. Create a trigger to run the workflow: `hermes triggers create --trigger-def ./triggers/link-shortcut.json --apihost=https://dev1407.slack.com` (This trigger has all of the inputs fully hard-coded for now just to make testing easier, so you won't see a prompt for inputs).
4. Grab the url from the trigger creation command, and drop it into the slack workspace your app is deployed to. It should unfurl with a `Run` button you can click to get things going.

### LocalDev mode
To test the app in localdev mode is a bit trickier, as you can't create the trigger for it in the CLI yet.

1. Check out the deno-slack-runtime and use the branch from [this PR](https://github.com/slackapi/deno-slack-runtime/pull/19).
2. Update the `slack.json` file's `start` hook to point to wherever you checked out the runtime to.
1. Start up your app with `hermes run --no-cleanup --apihost=https://dev1407.slack.com`
2. Visit https://api.dev.slack.com/methods/workflows.triggers.create/test and create a trigger - you can refer to the `triggers/link-shortcut.json` file to fill in the details. Refer to the app id you got once you started up in local dev mode for the `workflow_app_id` parameter.
3. Drop the url you get from creating the trigger into slack, and click the `Run` button that unfurls.