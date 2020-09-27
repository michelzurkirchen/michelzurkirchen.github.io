from facebook import GraphAPI
import datetime as dt
from json import loads
from requests import get
from re import search

# Exchange short lived access token for long lived access token
def long_token(short_token):
    app_id = "667185007475640"
    app_secret = "a6e48db00cf8e1fb260bebbf3d56a6ab"
    query = "https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id={}&client_secret={}&fb_exchange_token={}".format(app_id, app_secret, short_token)
    response = get(query)
    content = response.content
    token = json.loads(content.decode('utf-8'))['access_token']
    return token

def create_graph(token):
    return GraphAPI(access_token=token, version="3.1")

# Pages this user account has access to
def get_pages(graph):
    pages = {}
    pages_info = graph.get_object(id="me", fields="accounts")
    pages_info = pages_info['accounts']['data']

    for i, v in enumerate(pages_info):
        page_name = pages_info[i]['name']
        page_id = pages_info[i]['id']
        pages[page_name] = page_id

    return pages

# Get the UTMs from an URL and save it as an object
def get_utms(url):
    utm_source = search("utm_source%3D(.*?)%", url).group(1) if search("utm_source%3D(.*?)%", url) else None
    utm_medium = search("utm_medium%3D(.*?)%", url).group(1) if search("utm_medium%3D(.*?)%", url) else None
    utm_campaign = search("utm_campaign%3D(.*?)%", url).group(1) if search("utm_campaign%3D(.*?)%", url) else None
    utm_content = search("utm_content%3D(.*?)%", url).group(1) if search("utm_content%3D(.*?)%", url) else None
    utm_term = search("utm_term%3D(.*?)%", url).group(1) if search("utm_term%3D(.*?)%", url) else None

    utms = {
        "utm_source": utm_source,
        "utm_medium": utm_medium,
        "utm_campaign": utm_campaign,
        "utm_content": utm_content,
        "utm_term": utm_term
    }

    return utms

# List of posts from the page
def get_posts(graph, page, start_date=0, end_date=0): # Expect dates in YYYY-MM-DD format

    # Convert start_date and end_date if provided, else use today's date
    start_date = dt.date.today() if start_date == 0 else dt.datetime.strptime(start_date, "%Y-%m-%d").date()
    end_date = dt.date.today() if end_date == 0 else dt.datetime.strptime(end_date, "%Y-%m-%d").date()

    # Get first page of posts
    posts = graph.get_object(id=page + "/posts", fields="created_time,permalink_url,id,attachments")

    first_match = False # Found a first post within the date range.
    last_match = False # Found a first post outside the date range, after finding a first_match
    filtered = [] # List of posts within date range

    i = 0 # Temporary to not end up in an endless loop

    while last_match == False and i < 10:
        i += 1

        # Only append posts created within the daterange
        for post in posts['data']:
            created = dt.datetime.strptime(post['created_time'], "%Y-%m-%dT%H:%M:%S+0000").date()

            if created >= start_date and created <= end_date:
                post_transformed = {
                    "id": post["id"],
                    "created_time": post["created_time"],
                    "url": post["permalink_url"],
                    "target": post['attachments']['data'][0]['target']['url'],
                    "utms": get_utms(post['attachments']['data'][0]['target']['url'])
                }

                filtered.append(post_transformed)
                first_match = True

            elif first_match == True:
                last_match = True

        # Get the next page of results
        if last_match == False:
            next_page_query = posts['paging']['next']
            next_page_response = get(next_page_query)
            posts = loads(next_page_response.content.decode("utf-8"))

    return filtered
