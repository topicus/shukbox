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
    html.push('<li><span class="more-videos">+More Videos</span></li>');
    html.push('</ul>');
    document.getElementById('videoResultsDiv').innerHTML = html.join('');
    var autocompleter = $('#autocompleter li');
    autocompleter.click(function(e){
      if($(e.currentTarget).index()==autocompleter.length-1){
        autocomple_offset +=AUTOCOMPLETE_PAGE_SIZE;
        search(document.getElementById('nextsong').value, AUTOCOMPLETE_PAGE_SIZE);        
        currentSelected=-1;        
      }else{
        addSong($(this));
      }      
    });
}
/*SEARCH IN YOUTUBE*/
var search_timeout = null;
var autocomple_offset = 1;
function search(q){
  if(search_timeout) clearTimeout(search_timeout);
  
  var off = (typeof(autocomple_offset) !== 'undefined')? autocomple_offset : 1;
  if(q!==''){
    search_timeout = setTimeout(function(){
      var script = document.createElement('script');
      script.setAttribute('id', 'jsonScript');
      script.setAttribute('type', 'text/javascript');
      script.setAttribute('src', 'http://gdata.youtube.com/feeds/' + 
             'videos?vq='+q+'&max-results='+AUTOCOMPLETE_PAGE_SIZE+'&' + 
             'alt=json-in-script&callback=showMyVideos&' +
             'start-index='+off+'&' +
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

/*GET TIMESTAMP*/
function timestamp(){
  return new Date().getTime();  
}

/*SIMULATE INPUT EVENT*/
var old_input_state = '';
var timer_input_event = null;
function addInputEvent(){
  var inputnode = document.getElementById("nextsong");
  old_input_state = inputnode.value;
  timer_input_event = Meteor.setInterval(function(){
    if(old_input_state !== inputnode.value){
      search(inputnode.value);
      old_input_state = inputnode.value;
      autocomple_offset = 1;
    }
    if(inputnode.value===''){
      var autocompleter = document.getElementById("autocompleter");
      if(autocompleter) autocompleter.style.display = 'none';
      currentSelected = -1;
    }
  }, 100);
}
function removeInputEvent(){
  Meteor.clearInterval(timer_input_event);
}
/*END SIMULATE INPUT EVENT*/