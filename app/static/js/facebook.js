let authorised = undefined;
let pages = {};
//let posts = undefined;
let page = undefined;
let next = undefined;

window.fbAsyncInit = function() {
  FB.init({
    appId: '2769812323343725',
    cookie: true,
    xfbml: false,
    version: 'v8.0'
  });

  FB.getLoginStatus(function(response) {
    statusChangeCallback(response);
  });

};

(function(d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) {
    return;
  }
  js = d.createElement(s);
  js.id = id;
  js.src = "https://connect.facebook.net/en_US/sdk.js";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

function statusChangeCallback(response) {
  if (response.status == 'connected') {
    authorised = true
    // Check for the right permissions
    getPages()
  } else {
    authorised = false;
    // Hide everything else until someone has logged in and given the right permissions
  }
}

function checkLoginState() {
  FB.getLoginStatus(function(response) {
    statusChangeCallback(response);
  });
}

function getPages() {
  FB.api('/me?fields=accounts', function(response) {
    if (response && !response.error) {
      const response_pages = response['accounts']['data'];
      const select = document.getElementById("pages__list");

      for (page of response_pages) {
        if (!(page['name'] in pages)) {
          pages[page['name']] = {
            'id': page['id'],
            'access_token': page['access_token']
          };
          const opt = document.createElement('option');
          opt.innerText = page['name'];
          opt.pageId = page['id'];
          opt.accessToken = page['access_token'];
          select.appendChild(opt);
        }
      }
      return pages;
    }
  })
}

function getUtms(url) {
  const source = url.match(/utm_source%3D(.*?)%/)
  const medium = url.match(/utm_medium%3D(.*?)%/)
  const campaign = url.match(/utm_campaign%3D(.*?)%/)
  const content = url.match(/utm_content%3D(.*?)%/)
  const term = url.match(/utm_term%3D(.*?)%/)

  utms = {
    "source": source ? source[1] : "-",
    "medium": medium ? medium[1] : "-",
    "campaign": campaign ? campaign[1] : "-",
    "content": content ? content[1] : "-",
    "term": term ? term[1] : "-"
  }
  return utms
}

function formatPosts(posts) {
  for (const post of posts) {
    const hasAttachments = Object.keys(post).includes('attachments')

    formattedPost = {
      "created_time": post["created_time"].slice(0,10) + " " + post["created_time"].slice(11,16),
      "fbUrl": post["permalink_url"],
      "outboundUrl": hasAttachments ? (post['attachments']['data'][0]['target']['url'].includes("l.facebook") ? post['attachments']['data'][0]['target']['url'] : undefined) : undefined,
      "utms": hasAttachments ? getUtms(post['attachments']['data'][0]['target']['url']) : {"source": "-", "medium": "-", "campaign": "-", "content": "-", "term": "-"}
    }

    const table = document.getElementById("posts__table");

    if(!document.getElementById('posts__table__body')) {
      const tableBody = document.createElement("tbody");
      tableBody.id = "posts__table__body";
      table.append(tableBody);
    }

    const tableBody = document.getElementById("posts__table__body");
    let row = tableBody.insertRow(-1);
    let cellCreatedAt = row.insertCell(0);
    let cellFacebookUrl = row.insertCell(1);
    let cellOutboundUrl = row.insertCell(2);
    let cellUtmSource = row.insertCell(3);
    let cellUtmMedium = row.insertCell(4);
    let cellUtmCampaign = row.insertCell(5);
    let cellUtmTerm = row.insertCell(6);
    let cellUtmContent = row.insertCell(7);

    row.className = "posts__row";
    cellCreatedAt.innerHTML = formattedPost.created_time; // Formatteer naar datum en tijd, zonder timezone.
    cellFacebookUrl.innerHTML = `<a href="${formattedPost.fbUrl}">Link</a>`; // Gebruik het Facebook logo.
    cellOutboundUrl.innerHTML = formattedPost.outboundUrl ? `<a href="${formattedPost.outboundUrl}">Link</a>` : "-"; // Gebruik een href icon.
    cellUtmSource.innerHTML = formattedPost.utms.source;
    cellUtmMedium.innerHTML = formattedPost.utms.medium;
    cellUtmCampaign.innerHTML = formattedPost.utms.campaign;
    cellUtmContent.innerHTML = formattedPost.utms.content;
    cellUtmTerm.innerHTML = formattedPost.utms.term;
  }
}

function getPosts() {
  const select = document.getElementById("pages__list");
  const pageName = select.options[select.selectedIndex].innerText;

  if (document.getElementById("posts__table__body")) {
      const tableBody = document.getElementById("posts__table__body");
      tableBody.remove()
    }

  let page_id = pages[pageName]['id']
  FB.api(`/${page_id}/published_posts`, {
      'access_token': pages[pageName]['access_token'],
      'fields': 'created_time,permalink_url,id,attachments'
    },

    function(response) {
      posts = response['data']
      next = response['paging']['next'] ? response['paging']['next'] : undefined
      formatPosts(posts)
    })
}

let gnp = undefined
function getNext() {
  fetch(next)
  .then(function(response) {
    return response.json()
  })
  .then(function(data) {
    gnp = data
    let posts = data['data']
    formatPosts(posts)

    next = data['paging']['next'] ? data['paging']['next'] : undefined
  })
}
