import pandas as pd
import utils.adapter as adapter
import utils.constant as Constant
import utils.common as util

# study with data file
def study():
    try:
        # read the data
        data = pd.ExcelFile(Constant.FILE_PATH)

        # convert sheet data into dictionary list
        product_list = data.parse(Constant.SHEET_PRODUCT).to_dict('records')
        product_helper_list = data.parse(Constant.SHEET_PRODUCT_HELPER).to_dict('records')
        video_list = data.parse(Constant.SHEET_VIDEO).to_dict('records')
        salon_list = data.parse(Constant.SHEET_SALON).to_dict('records')
        article_list = data.parse(Constant.SHEET_STUDY).to_dict('records')

        # get the key of helper
        helper_key = list(product_helper_list[0].keys())

        # make the study result with each helper
        data = dict()
        for helper_list_item in product_helper_list:
            helper_item = adapter.get_feature_dictionary(helper_list_item, helper_key)
            # make the key of dictionary
            key = util.make_learning_key(helper_item)

            # calculate the similarity between helper item and available item
            product = study_product(helper_item, product_list)
            video = study_video(helper_item, video_list)
            salon = studySalon(helper_item, salon_list)
            article = study_article(helper_item, article_list)

            # make the value of dictionary
            temp_data = dict()
            temp_data['product'] = product
            temp_data['video'] = video
            temp_data['salon'] = salon
            temp_data['article'] = article

            # make the total data
            data[key] = temp_data

        # write the learning machine into the file
        util.write_machine(data)
        return True
    except IOError:
        return False


# calculate the similarities between a helper item and a products
# and find a available product
def study_product(feature, product_list):
    similarities = []
    for product in product_list:
        # get the feature dictionary in space from available product dictionary
        p_feature = adapter.get_feature_dictionary(product, Constant.SHEET_PRODUCT)
        # calculate the similarity
        p_feature['length'] = feature['length']
        p_feature['history'] = feature['history']
        temp = analysis_similarity(p_feature, feature)
        # add the similarity into list
        similarities.append(temp)

    # find the similar product
    product = []
    for temp in range(3):
        similarity = min(similarities)
        index = similarities.index(similarity)
        product.append(product_list[index])
        similarities[index] = 20

    return product


# calculate the similarities between a helper item and a videos
# and find a available video
def study_video(feature, video_list):
    similarities = []
    for video in video_list:
        # get the feature dictionary in space from available video dictionary
        video_feature = adapter.get_feature_dictionary(video, Constant.SHEET_VIDEO)
        # calculate the similarity
        video_feature['porosity'] = feature['porosity']
        temp = analysis_similarity(video_feature, feature)
        # add the similarity into list
        similarities.append(temp)

    # find the similar video
    videos = []
    for temp in range(3):
        similarity = min(similarities)
        index = similarities.index(similarity)
        videos.append(video_list[index])
        similarities[index] = 20

    return videos


# calculate the similarities between a helper item and a salons
# and find a available salon
def studySalon(feature, salon_list):
    similarities = []
    for salon in salon_list:
        # get the feature dictionary in space from available salon dictionary
        salon_feature = adapter.get_feature_dictionary(salon, Constant.SHEET_SALON)
        # calculate the similarity
        salon_feature['porosity'] = feature['porosity']
        salon_feature['history'] = feature['history']
        temp = analysis_similarity(salon_feature, feature)
        # add the similarity into list
        similarities.append(temp)

    # find the similar salon
    salons = []
    for temp in range(3):
        similarity = min(similarities)
        index = similarities.index(similarity)
        salons.append(salon_list[index])
        similarities[index] = 20

    return salons

# calculate the similarities between a helper item and a articles
# and find a available article
def study_article(feature, article_list):
    similarities = []
    for article in article_list:
        # get the feature dictionary in space from available article dictionary
        article_feature = adapter.get_feature_dictionary(article, Constant.SHEET_STUDY)
        # calculate the similarity
        article_feature['porosity'] = feature['porosity']
        article_feature['density'] = feature['density']
        temp = analysis_similarity(article_feature, feature)
        # add the similarity into list
        similarities.append(temp)

    # find the similar article
    articles = []
    for temp in range(3):
        similarity = min(similarities)
        index = similarities.index(similarity)
        articles.append(article_list[index])
        similarities[index] = 20

    return articles


# calculate the similarity between two feature value
def analysis_similarity(point1, point2):
    diffTexture = point1['texture'] - point2['texture']
    diffLength = point1['length'] - point2['length']
    diffDensity = point1['density'] - point2['density']
    diffPorosity = point1['porosity'] - point2['porosity']
    diffHistory = point1['history'] - point2['history']
    similarity = pow(pow(diffTexture, 2) + pow(diffLength, 2) + pow(diffDensity, 2) + pow(diffPorosity, 2) + pow(diffHistory, 2), 0.5)
    return similarity
