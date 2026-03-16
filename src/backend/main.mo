import Array "mo:core/Array";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

actor {
  type VideoProject = {
    id : Text;
    title : Text;
    owner : Principal;
    created : Time.Time;
    updated : Time.Time;
    videoBlob : Storage.ExternalBlob;
    edits : Text;
  };

  type SoundCategory = {
    #beats;
    #transitions;
    #ambience;
    #sfx;
  };

  module SoundCategory {
    public func compare(cat1 : SoundCategory, cat2 : SoundCategory) : Order.Order {
      switch (cat1, cat2) {
        case (#beats, #beats) { #equal };
        case (#beats, _) { #less };
        case (#transitions, #beats) { #greater };
        case (#transitions, #transitions) { #equal };
        case (#transitions, _) { #less };
        case (#ambience, #sfx) { #less };
        case (#ambience, #ambience) { #equal };
        case (#ambience, _) { #greater };
        case (#sfx, #sfx) { #equal };
        case (#sfx, _) { #greater };
      };
    };
  };

  type SoundEffect = {
    id : Text;
    name : Text;
    category : SoundCategory;
    duration : Nat;
    audioBlob : Storage.ExternalBlob;
  };

  module SoundEffect {
    public func compare(effect1 : SoundEffect, effect2 : SoundEffect) : Order.Order {
      switch (SoundCategory.compare(effect1.category, effect2.category)) {
        case (#equal) { Text.compare(effect1.name, effect2.name) };
        case (order) { order };
      };
    };
  };

  public type UserProfile = {
    name : Text;
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  include MixinStorage();

  let projects = Map.empty<Text, VideoProject>();
  let soundEffects = Map.empty<Text, SoundEffect>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Project Functions
  public shared ({ caller }) func createProject(
    id : Text,
    title : Text,
    videoBlob : Storage.ExternalBlob,
    edits : Text,
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create projects");
    };

    let now = Time.now();
    let project : VideoProject = {
      id;
      title;
      owner = caller;
      created = now;
      updated = now;
      videoBlob;
      edits;
    };

    projects.add(id, project);
  };

  public shared ({ caller }) func updateProject(
    id : Text,
    title : Text,
    videoBlob : Storage.ExternalBlob,
    edits : Text,
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update projects");
    };

    let project = switch (projects.get(id)) {
      case (null) { Runtime.trap("Project not found") };
      case (?p) { p };
    };

    if (project.owner != caller) {
      Runtime.trap("Unauthorized: Only owner can update project");
    };

    let updatedProject : VideoProject = {
      id;
      title;
      owner = caller;
      created = project.created;
      updated = Time.now();
      videoBlob;
      edits;
    };

    projects.add(id, updatedProject);
  };

  public shared ({ caller }) func deleteProject(id : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can delete projects");
    };

    let project = switch (projects.get(id)) {
      case (null) { Runtime.trap("Project not found") };
      case (?p) { p };
    };

    if (project.owner != caller) {
      Runtime.trap("Unauthorized: Only owner can delete project");
    };

    projects.remove(id);
  };

  public query ({ caller }) func getMyProjects() : async [VideoProject] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view projects");
    };

    projects.values().toArray().filter(
      func(p) { p.owner == caller }
    );
  };

  public query ({ caller }) func getProjectById(id : Text) : async VideoProject {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view projects");
    };

    switch (projects.get(id)) {
      case (null) { Runtime.trap("Project not found") };
      case (?project) {
        if (project.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own projects");
        };
        project;
      };
    };
  };

  // Sound Effects Functions
  public shared ({ caller }) func addSoundEffect(
    id : Text,
    name : Text,
    category : SoundCategory,
    duration : Nat,
    audioBlob : Storage.ExternalBlob,
  ) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can add sound effects");
    };

    let effect : SoundEffect = {
      id;
      name;
      category;
      duration;
      audioBlob;
    };

    soundEffects.add(id, effect);
  };

  public shared ({ caller }) func removeSoundEffect(id : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can remove sound effects");
    };

    soundEffects.remove(id);
  };

  public query ({ caller }) func getSoundEffectsByCategory(category : SoundCategory) : async [SoundEffect] {
    soundEffects.values().toArray().filter(
      func(e) { e.category == category }
    );
  };

  public query ({ caller }) func getAllCategories() : async [SoundCategory] {
    [#beats, #transitions, #ambience, #sfx];
  };
};
