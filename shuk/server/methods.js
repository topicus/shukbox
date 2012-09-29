Meteor.methods({
  addPlaylist: function(doc){
    console.log("Main::addPlaylist");
    doc.when = Date.now(); // ms since epoch
    return PlayLists.insert(doc);
  }, 
  addVideo: function(doc){
    console.log(doc);
    console.log("Main::addSong");
    doc.when = Date.now(); // ms since epoch
    return Videos.insert(doc);
  },
  addActivity: function(doc){
    console.log("Main::addActivity");
    doc.when = Date.now();
    return Activities.insert(doc);
  }
});
