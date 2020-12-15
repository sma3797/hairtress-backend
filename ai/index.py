import utils.common as common
import json

# construct the user input data
user_input = common.make_input()
# start
result = common.start(user_input)
# send result
print(json.dumps(result))
