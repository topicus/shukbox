//var listkey = null;  
var CONTROL_KEYCODES = new Array(40,38,37,39)
var ENTER = 13;
var currentSelected = -1;
var HAS_INPUT_EVENT = 0;

if(QueryString.listkey != undefined){
  Session.set('listkey', QueryString.listkey)
}
var player;

Session.set('current', 0);
var current = 0;
var old_current = -1;
var weight = 1000;  
var tag = document.createElement('script');
tag.src = "//www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

if(!Meteor.user()){
  var username = 'anonym'+Meteor.uuid();
  var password = Meteor.uuid()
  Meteor.createUser({username:username, password:password}, null, function(r){
    Meteor.loginWithPassword(username, password);
  });
}
function createListKey(name){
  if(Meteor.user() && !Session.get('listkey')){
    name = (name)? name : Meteor.uuid();
    Session.set('listkey', Playlists.insert({name:name, user:Meteor.user()._id}));
  }
}
function createPlayChannel(){
  if(Meteor.user() && Session.get('listkey')){
    pchannel =  PlayChannels.insert({playlist:Session.get('listkey'), user:Meteor.user()._id, current:Session.get('current')});
    console.log(pchannel);
    Session.set('playchannel',pchannel);
  }
}
function onYouTubeIframeAPIReady() {
  cursor = Songs.find({listkey:Session.get('listkey')},{sort: {score: -1}});
  if(cursor.count())
    playSong(cursor.fetch()[0].name);
}
function playSong(vid){
    if(!player){
      player = new YT.Player('player-div', {
        height: '300',
        width: '100%',
        videoId: vid,
        playerVars: { 'autoplay': 0, 'wmode': 'opaque' }, 
        events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange
        }
      });
    }else{
      player.loadVideoById(vid);
      player.playVideo();
    }
}
function onPlayerReady(event) {
  player.playVideo();
}
function onPlayerStateChange(event) {
  if(event.data==YT.PlayerState.ENDED){
    nextSong();  
  }
}
function stopVideo() {
  player.stopVideo();
}  
function nextSong(){
  setCurrent('modify',1);
  c = Songs.find({listkey:Session.get('listkey')},{sort: {score: -1}}).fetch()[Session.get('current')];
  if(c)
    playSong(c.name);
  else {
    setCurrent('set',0);
    c = Songs.find({listkey:Session.get('listkey')},{sort: {score: -1}}).fetch()[Session.get('current')];
    playSong(c.name);
  }
}
function setCurrent(m,i){
  old_current = current;
  if(m=='modify'){
    Session.set('current', Session.get('current') + i);
  }else if(m=='set'){
    Session.set('current', i);
  }
  var lis = $('ul.playlist li');
  lis.removeClass('current');
  var currentLi = lis.eq(Session.get('current'));
  currentLi.addClass('current');
  $('ul.playlist').css('margin-top','-'+currentLi.position().top+'px');

  
  PlayChannels.update({_id: Session.get('playchannel')},{current:Session.get('current')});
  PlayChannels.find({_id: Session.get('playchannel')}).fetch()[0];
}
Template.musiclist.invokeAfterLoad = function () {
  Meteor.defer(function () {     
    $('input.nextsong').bind('input', function() {
      HAS_INPUT_EVENT = 1;
      search($('#nextsong').val());
    });
    $('.tip').tooltip({animation:true,placement:'bottom'});
    
    sharePop = $('.share');
    
    if(Session.get('listkey')){
      $('#listurl').html('<input type="text" value="'+window.location.protocol+'//'+window.location.host+"/?listkey="+Session.get('listkey')+'" />');
    }

  });
  return "";
};  
Template.musiclist.songs = function () {
  return Songs.find({listkey:Session.get('listkey')},{sort: {score: -1}});
};
Template.musiclist.events = {
  'click .vote': function () {
    Songs.update({_id: this._id},{$inc:{score:1}});
  }, 
  'click input.delete': function () { 
    Songs.remove(this._id);
  },
  'click .share':function(){
    $('#shares').show();
  },
  'click .playsong': function () {
    if(!Session.get('playchannel')){    
      createPlayChannel();
    }
    Meteor.flush();
    $('#playchannelurl').html('<input type="text" value="'+window.location.protocol+'//'+window.location.host+"/?playchannel="+Session.get('playchannel')+'" />');    
    c = Songs.find({listkey:Session.get('listkey')},{sort: {score: -1}}).fetch()[Session.get('current')];          
    setCurrent('set',0);
    playSong(c.name);        
   },
  'click span.title': function () {
    var c = Songs.find({listkey:Session.get('listkey')},{sort: {score: -1}}).fetch();
    var id = this._id; 
    for(k=0,l=c.length;k<l;k++){
      if(c[k]._id == id){
        setCurrent('set',k);
        playSong(c[k].name);
      }
    }
   },
  'click .clearlist': function () {         
      Songs.remove({});
   },      
  'click .skip': function () {
      nextSong();
   },
  'keyup input.nextsong':function(e){
    if(!HAS_INPUT_EVENT && jQuery.inArray(e.keyCode, CONTROL_KEYCODES)==-1 && e.keyCode!=ENTER){
      search($('#nextsong').val());
    }
   },
  'keydown input.nextsong':function(e){
    if(jQuery.inArray(e.keyCode, CONTROL_KEYCODES)!=-1){
      autocompleter = $('#autocompleter li');
      old = currentSelected;
      if(currentSelected ==-1){
        currentSelected = 0;
      }else if(currentSelected==autocompleter.length-1 && e.keyCode == 40){
        currentSelected=0;
      }else if(!currentSelected && e.keyCode == 38){
        currentSelected = autocompleter.length-1;
      }else{
        if(e.keyCode == 40)
          currentSelected++;
        else if(e.keyCode ==38)
          currentSelected--;
      }
      if(old!=-1){
        $('#autocompleter li').eq(old).removeClass('selected')
      }
      $('#autocompleter li').eq(currentSelected).addClass('selected')
    }
    if(e.keyCode==ENTER){
      addSong($('#autocompleter li').eq(currentSelected));
    }
   }     
};
function search(q){
  if(q!=''){
    var script = document.createElement('script');
    script.setAttribute('id', 'jsonScript');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', 'http://gdata.youtube.com/feeds/' + 
           'videos?vq='+q+'&max-results=5&' + 
           'alt=json-in-script&callback=showMyVideos&' + 
           'orderby=relevance&sortorder=descending&format=5&fmt=18');
    document.documentElement.firstChild.appendChild(script);
  }else{
    document.getElementById("videoResultsDiv").innerHTML = '';
  }
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
function addSong(jselector){
  if(!Session.get('listkey')){    
    createListKey();
  }
  Meteor.flush();
  $('#listurl').html('<input type="text" value="'+window.location.protocol+'//'+window.location.host+"/?listkey="+Session.get('listkey')+'" />');
  vid = get_youtube_id(jselector.children('a').attr("href"));
  title = jselector.children('a').attr("title");
  item_min_score = Songs.findOne({listkey:Session.get('listkey')},{sort: {score: 1}, limit:1});
  if(item_min_score) weight = item_min_score.score - 1;
  Songs.insert({name: vid, score: weight, title:title, listkey:Session.get('listkey')});
  $("#autocompleter").hide();
  currentSelected = -1;
  $('.nextsong').val('');  
  c = Songs.find({listkey:Session.get('listkey')},{sort: {score: -1}});
  if(c.count()){      
    $('ul.playlist').css("border", '1px solid #CCC');
  }    
}
function get_youtube_id(url){
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
    var match = url.match(regExp);
    if (match&&match[7].length==11){
        return match[7];
    }
    return false;
}