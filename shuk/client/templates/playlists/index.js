Meteor.startup(function(){
  Template.playlists.rendered = function(){
  };
  Template.playlists.mylists = function(){
    if (Meteor.user())
      return PlayLists.find({user:Meteor.user()._id, saved:true},{sort: {when: -1}});
    else
      return false;
  };
  Template.playlist.is_current = function(){
    if(Session.equals('listkey', this._id)){
      return 'active';
    }
    return '';
  };
  Template.playlists.events({
    'click li':function(e){
      controls.stop();
      playManager.set(this._id);
      Meteor.flush();
      $('.reseteable').button('toggle');
    },
    'click #activate-second-toolbar': function(e){
      $playlists = $('#playlists');
      $playlists.toggleClass('toggled');
    },
    'click .create':function(){
      Meteor.flush();
      playManager.create(true);
      Meteor.defer(function(){
        $('#save-control').show();
        $('#listname').select();         
      }); 
    },
    'click .cancel-edit-list':function(e){
      Meteor.flush();
      $('#save-control').hide();
    },
    'click .update':function(e){
      Meteor.flush();
      $('.savelist').html('Save');
      $('#save-control').show();
      $('#listname').select();
    },
    'click .savelist':function(){   
      $('#save-control').hide();    
      playManager.save();
    },
    'keydown #save-control input':function(e){
      if(e.which===13){
        $('#save-control').hide();      
        playManager.save();
      }
    },
    'click .edit-button':function(e){
      $('#save-control').show();
      $('#listname').val(this.name);
      $('#listname').select();
      $('.savelist').html('Edit');
      Session.set('edited', this._id);
      return false;
    },
    'click .delete': function () {
      Meteor.flush();
      setModalMessage("Delete playlist?", "Do you want to delete the Playlist "+this.name+"?")
      var that = this;
      $('#alert-window').modal('show');
      $('#alert-window .confirm').on('click', function () {
        playManager.del(that);
        $('#alert-window').modal('hide');
      }); 
      $('#alert-window .discard').on('click', function () {
        $('#alert-window').modal('hide');
      });        
      return false;
    }
  });
});