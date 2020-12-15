import utils.constant as Constant


# get the feature as space variable form dictionary
# index: dictionary data type
def get_feature_dictionary(dictionary, index):
    # for product dictionary
    if index == Constant.SHEET_PRODUCT:
        texture = dictionary[Constant.KEY_HAIR_TYPE]
        density = dictionary[Constant.KEY_DENSITY]
        porosity = dictionary[Constant.KEY_POROSITY]
        length = ''
        history = ''
    # for video dictionary
    elif index == Constant.SHEET_VIDEO:
        texture = dictionary[Constant.KEY_TEXTURE]
        density = dictionary[Constant.KEY_DENSITY]
        length = dictionary[Constant.KEY_LENGTH]
        history = dictionary[Constant.KEY_PROCESSING]
        porosity = ''
    # for salon dictionary
    elif index == Constant.SHEET_SALON:
        texture = dictionary[Constant.KEY_TEXTURE]
        density = dictionary[Constant.KEY_DENSITY]
        length = dictionary[Constant.KEY_LENGTH]
        history = ''
        porosity = ''
    # for article dictionary
    elif index == Constant.SHEET_STUDY:
        texture = dictionary[Constant.KEY_HAIR_TYPE]
        length = dictionary[Constant.KEY_LENGTH]
        history = dictionary[Constant.KEY_PROCESSING]
        density = ''
        porosity = ''
    # for helper dictionary
    else:
        texture = dictionary[index[1]]
        length = dictionary[index[2]]
        density = dictionary[index[3]]
        porosity = dictionary[index[4]]
        history = dictionary[index[5]]

    # select only feature from dictionary
    feature = dict()
    feature['texture'] = texture
    feature['length'] = length
    feature['density'] = density
    feature['porosity'] = porosity
    feature['history'] = history

    # convert feature into space value
    feature_space = convert_dict_into_feature_space(feature)
    return feature_space


# convert the feature dictionary into space variable dictionary
def convert_dict_into_feature_space(dictionary):
    # for the hair type
    if dictionary['texture'] == Constant.TEXTURE_TYPE_1A_1B:
        textureNum = Constant.TEXTURE_TYPE_1A_1B_NUMBER
    elif dictionary['texture'] == Constant.TEXTURE_TYPE_1C:
        textureNum = Constant.TEXTURE_TYPE_1C_NUMBER
    elif dictionary['texture'] == Constant.TEXTURE_TYPE_2A:
        textureNum = Constant.TEXTURE_TYPE_2A_NUMBER
    elif dictionary['texture'] == Constant.TEXTURE_TYPE_2B:
        textureNum = Constant.TEXTURE_TYPE_2B_NUMBER
    elif dictionary['texture'] == Constant.TEXTURE_TYPE_2C:
        textureNum = Constant.TEXTURE_TYPE_2C_NUMBER
    elif dictionary['texture'] == Constant.TEXTURE_TYPE_3A:
        textureNum = Constant.TEXTURE_TYPE_3A_NUMBER
    elif dictionary['texture'] == Constant.TEXTURE_TYPE_3B:
        textureNum = Constant.TEXTURE_TYPE_3B_NUMBER
    elif dictionary['texture'] == Constant.TEXTURE_TYPE_3C:
        textureNum = Constant.TEXTURE_TYPE_3C_NUMBER
    elif dictionary['texture'] == Constant.TEXTURE_TYPE_4A:
        textureNum = Constant.TEXTURE_TYPE_4A_NUMBER
    elif dictionary['texture'] == Constant.TEXTURE_TYPE_4B:
        textureNum = Constant.TEXTURE_TYPE_4B_NUMBER
    elif dictionary['texture'] == Constant.TEXTURE_TYPE_4C:
        textureNum = Constant.TEXTURE_TYPE_4C_NUMBER
    else:
        textureNum = Constant.STRING_NONE_NUMBER

    # for the hair density
    if dictionary['density'] == Constant.STRING_LOW:
        densityNum = Constant.STRING_LOW_NUMBER
    elif dictionary['density'] == Constant.STRING_MEDIUM:
        densityNum = Constant.STRING_MEDIUM_NUMBER
    elif dictionary['density'] == Constant.STRING_HIGH:
        densityNum = Constant.STRING_HIGH_NUMBER
    else:
        densityNum = Constant.STRING_NONE_NUMBER

    # for the hair length
    if dictionary['length'] == Constant.STRING_SHORT:
        lengthNum = Constant.STRING_SHORT_NUMBER
    elif dictionary['length'] == Constant.STRING_MEDIUM:
        lengthNum = Constant.STRING_MEDIUM_NUMBER
    elif dictionary['length'] == Constant.STRING_LONG:
        lengthNum = Constant.STRING_LONG_NUMBER
    else:
        lengthNum = Constant.STRING_NONE_NUMBER

    # for the hair porosity
    if dictionary['porosity'] == Constant.STRING_LOW:
        porosityNum = Constant.STRING_LOW_NUMBER
    elif dictionary['porosity'] == Constant.STRING_MEDIUM:
        porosityNum = Constant.STRING_MEDIUM_NUMBER
    elif dictionary['porosity'] == Constant.STRING_HIGH:
        porosityNum = Constant.STRING_HIGH_NUMBER
    else:
        porosityNum = Constant.STRING_NONE_NUMBER

    # for the processing history
    if dictionary['history'] == Constant.STRING_PERM_OR_RELAXER:
        historyNum = Constant.STRING_PERM_OR_RELAXER_NUMBER
    elif dictionary['history'] == Constant.STRING_BLEACHED:
        historyNum = Constant.STRING_BLEACHED_NUMBER
    elif dictionary['history'] == Constant.STRING_DYED:
        historyNum = Constant.STRING_DYED_NUMBER
    else:
        historyNum = Constant.STRING_NONE_NUMBER

    # make the space value dictionary
    spaceVariable = dict()
    spaceVariable['texture'] = textureNum
    spaceVariable['length'] = lengthNum
    spaceVariable['density'] = densityNum
    spaceVariable['porosity'] = porosityNum
    spaceVariable['history'] = historyNum

    return spaceVariable
