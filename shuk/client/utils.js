

var QueryString = function () {
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = pair[1];
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]], pair[1] ];
      query_string[pair[0]] = arr;
    } else {
      query_string[pair[0]].push(pair[1]);
    }
  } 
    return query_string;
} ();  

function get_youtube_id(url){
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
    var match = url.match(regExp);
    if (match&&match[7].length==11){
        return match[7];
    }
    return false;
}
function showMyVideos(data){
    var feed = data.feed;
    var entries = feed.entry || [];
    var html = ['<ul id="autocompleter">'];
    for (var i = 0; i < entries.length; i++)
    {
        var entry = entries[i];
        var playCount = entry.yt$statistics.viewCount.valueOf() + ' views';
        var title = entry.title.$t;
        var thumb = entry.media$group.media$thumbnail[3].url;
        var thumb_height = entry.media$group.media$thumbnail[3].height * 0.5;
        var thumb_width = entry.media$group.media$thumbnail[3].width * 0.5;
        var thumb_tag = '<div style="height:'+thumb_height+'px; width:'+thumb_width+'px" class="thumb-search"><img src="'+thumb+'"/></div>'
        var lnk = '<a data-thumb="'+thumb+'" title="'+entry.title.$t+'" href = \"' + entry.link[0].href + '\"></a>';
        html.push('<li>', thumb_tag, title, ', ', playCount, ', ', lnk, '</li>');
    }
    html.push('</ul>');
    document.getElementById('videoResultsDiv').innerHTML = html.join('');
    $('#autocompleter li').click(function(){
      addSong($(this));
    });
}
/*SEARCH IN YOUTUBE
*@param string
*/
var search_timeout = null;
function search(q){
  if(search_timeout)
    clearTimeout(search_timeout);
  if(q!==''){
    search_timeout = setTimeout(function(){
      var script = document.createElement('script');
      script.setAttribute('id', 'jsonScript');
      script.setAttribute('type', 'text/javascript');
      script.setAttribute('src', 'http://gdata.youtube.com/feeds/' + 
             'videos?vq='+q+'&max-results=6&' + 
             'alt=json-in-script&callback=showMyVideos&' + 
             'orderby=relevance&sortorder=descending&format=5&fmt=18');
      document.documentElement.firstChild.appendChild(script);
    }, 200);
  }else{
    document.getElementById("autocompleter").style.display = 'none';
  }
  
}
function include_facebook(){
  window.fbAsyncInit = function() {
    FB.init({
      appId      : '407750262605974', // App ID
      channelUrl : '//'+window.location.host+'/channel.html', // Channel File
      status     : true, // check login status
      cookie     : true, // enable cookies to allow the server to access the session
      xfbml      : true  // parse XFBML
    });
  };
  (function(d){
     var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement('script'); js.id = id; js.async = true;
     js.src = "//connect.facebook.net/en_US/all.js";
     ref.parentNode.insertBefore(js, ref);
   }(document));  
}
function timestamp(){
  return new Date().getTime();  
}