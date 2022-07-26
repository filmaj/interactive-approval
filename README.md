# Platform 2.0 Interactive Function Example

This app includes a single `approval` function that is meant as an example of how we can implement an app with function-specific interactivity handlers, i.e. `block_actions`, `view_submission` and `view_closed` handlers. Currently the function sends a message with approve and deny buttons, and launches a modal flow if deny is clicked, otherwise completes the function if approve is clicked.

## Testing Instructions

To grab the code and run this yourself should be pretty straight-forward as well.

1. Check this repo out.
2. Deploy the app to workspace, `hermes deploy` or `hermes run` for local development.
3. Create a trigger to run the workflow, make sure to select the workspace you deployed to: `hermes triggers create --trigger-def ./triggers/link-shortcut.json` (This trigger has all of the inputs fully hard-coded for now just to make testing easier, so you won't see a prompt for inputs. We can update this to use the Send a Form step in the future to collect them at runtime).
4. Grab the url from the trigger creation command, and drop it into the slack workspace your app is deployed to. It should unfurl with a `Run` button you can click to get things going.