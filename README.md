# Twine 2 Chat

## Built with
- Express
- Botkit

## How it works
This tool uses Express and Botkit to deploy a bot server that communicates with Telegram messaging. Visiting the root path allows you to upload a Twine HTML file which will "train" the bot with story dialog. This works by first converting the Twine to a graph object, then traversing the graph with Botkit dialog/thread building API. Once trained, you can interact with the bot through Telegram and navigate the story based on your responses to the bot.

## Twine file
### Assumptions
- Each node name starts with a scene label/ID
### Manual edit to Twine project
- Normalize responses/variables
  - yes
  - no
  - no response
  - {VARIABLE_NAME}
### Future Improvements
- Would be better to set scene labels (e.g. 1.3A) as tags rather than the title
- NLU for better intents using DialogFlow, Wit, Watson, etc.
- Timing logic for "no response"
- Check length of message text to determine if it's short or long


## References
- https://www.watershed.co.uk/studio/projects/tendencyto-spill-using-chatbot-storytelling-platform
- https://www.wordstream.com/blog/ws/2017/10/04/chatbots


## Develop
### Install
`yarn install`

### Run
`yarn dev`

### Build & Deploy
`yarn build && yarn deploy`
