import sys
import os
import pickle
import utils.constant as Constant
import utils.learning as learning


# get the args from command line and construct the user input
def make_input():
    # first agr is file name: index.py
    # remove the first agr
    sys.argv.pop(0)
    args = sys.argv

    # construct the user_input as dictionary
    user_input = dict()
    user_input['texture'] = args[0]
    user_input['length'] = args[1]
    user_input['density'] = args[2]
    user_input['porosity'] = args[3]
    user_input['history'] = args[4]

    # print(user_input)
    return user_input


# start the study or learning
# if learning machine exist, get the result from the it,
# else after studying, and then make the learning machine and get the result with learning machine.
def start(user_input):
    if os.path.exists(Constant.MACHINE_NAME):
        # learning
        result = machine_start(user_input)
    else:
        # study
        if learning.study():
            # print("Success study! \n" + "Learning machine file is " + Constant.MACHINE_NAME + ".")
            result = machine_start(user_input)
        else:
            result = "Data for study does not exist! \n" + "Data for study must be in the " + Constant.FILE_PATH

    return result


# find the available data by using the learning machine
def machine_start(user_input):
    try:
        key = make_learning_key(user_input)
        try:
            machine = read_machine()
            message = machine[key]
        except pickle.UnpicklingError:
            message = "Learning machine may be changed! \nPlease study again and please!"
    except IOError:
        message = "Learning machine does not exist! \n" + "Learning machine must be in the " + Constant.MACHINE_NAME

    return message


# save the learning machine into file
def write_machine(result):
    with open(Constant.MACHINE_NAME,  'wb') as machine:
        pickle.dump(result, machine)

    return


# read the learning machine
def read_machine():
    with open(Constant.MACHINE_NAME, 'rb') as machine:
        result = pickle.load(machine)

    return result


# generate the key for learning machine
def make_learning_key(feature):
    key = ''
    for item in feature.values():
        key = key + str(item)
    return key
