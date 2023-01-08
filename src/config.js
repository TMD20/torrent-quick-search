function addNewClient(e) {
  e.preventDefault();
  e.stopPropagation();
  saveDownloadClient();
  recreateDownloadClientNode();
}

function replaceValues(oldSubmissionForm, newSubmissionForm) {
  Array.from(oldSubmissionForm.querySelectorAll("input"))
    .filter((e) => e.value != "" || e.value != null)
    .forEach((e) => {
      let node = newSubmissionForm.querySelector(`#${e.getAttribute("id")}`);
      if (node) {
        node.value = e.value || "";
      }
    });
}

function onSelectChange(event) {
  let replaceHelper = function (oldSubmissionForm, newSubmissionForm) {
    replaceValues(oldSubmissionForm, newSubmissionForm);
    oldSubmissionForm.parentElement.replaceChild(
      newSubmissionForm.querySelector("form>div"),
      oldSubmissionForm
    );
  };

  let wrapper = GM_config.fields["downloadclients"].wrapper;
  let oldSubmissionForm = wrapper.querySelector(
    "#torrent-quicksearch-newclientWrapper>form>div"
  );
  let newSubmissionForm = document.createElement("div");
  switch (event.target.value) {
    case "Sonarr":
      newSubmissionForm.appendChild(
        clientSubmissionGenerator(["clientName", "clientURL", "clientAPI"])
      );

      break;
    case "Radarr":
      newSubmissionForm.appendChild(
        clientSubmissionGenerator(["clientName", "clientURL", "clientAPI"])
      );

      break;
    case "Rtorrent":
      newSubmissionForm.appendChild(
        clientSubmissionGenerator([
          "clientName",
          "clientURL",
          "clientUserName",
          "clientPassword",
          "clientLabel",
          'clientDir',
          "clientAuto"
        ])
      );

      break;

    case "Qbittorrent":
      newSubmissionForm.appendChild(
        clientSubmissionGenerator([
          "clientName",
          "clientURL",
          "clientUserName",
          "clientPassword",
          "clientCategory",
          "clientTags",
          "clientDir",
           "clientAuto"
        ])
      );

      case "Transmission":
        newSubmissionForm.appendChild(
          clientSubmissionGenerator([
            "clientName",
            "clientURL",
            "clientUserName",
            "clientPassword",
            "clientGroups",
            "clientLabels",
            "clientDir",
             "clientAuto"
          ])
          
        );
      break;
      case "Nzbget":
        newSubmissionForm.appendChild(
          clientSubmissionGenerator([
            "clientName",
            "clientURL",
            "clientUserName",
            "clientPassword",
            "clientCategory",
            "clientAuto"
          ])
          
          
        );
        break
        case "Sab":
          newSubmissionForm.appendChild(
            clientSubmissionGenerator([
              "clientName",
              "clientURL",
              "clientAPI",
              "clientCategory",
              "clientAuto"
            ])
            
            
          );
          break  
    default:
      return
    
  }
  replaceHelper(oldSubmissionForm, newSubmissionForm);

}

function clientSubmissionGenerator(keys) {
  let options = {
    clientName: ` <label for="Name">Client Name:</label>
                <input type="text" placeholder="Name"  id="clientName" name="clientName">`,
    clientURL: `   <label for="clientURL">Client URL:</label>

              <input type="text" placeholder="URL" id="clientURL" name="clientURL">`,
    clientAPI: `              <label for="clientAPI">Client API:</label>

              <input type="text" placeholder="API" id="clientAPI" name="clientAPI">`,

    clientUserName: ` <label for="clientUserName">Client Username:</label>
              <input type="text" placeholder="Username" id="clientUserName" name="clientUserName">`,
    clientPassword: ` <label for="clientUserPassword">Client Password:</label>
              <input type="password" placeholder="Password" id="clientPassword" name="clientPassword">`,

    clientLabel: ` <label for="clientLabel">Client Label:</label>
              <input type="text" placeholder="Label" id="clientLabel" name="clientLabel">`,
    clientCategory: ` <label for="clientCategory">Client Category:</label>
              <input type="text" placeholder="Category" id="clientCategory" name="clientCategory">`,
    clientTags: ` <label for="clientTags">Client Tags:</label>
              <input type="text" placeholder="Tags" id="clientTags" name="clientTags">`,
      clientLabels: ` <label for="clientLabels">Client Labels/Labels:</label>
              <input type="text" placeholder="Labels" id="clientLabels" name="clientLabels">`,      
    clientDir: ` <label for="clientDir">Client Directory:</label>
              <input type="text" placeholder="Dir" id="clientDir" name="clientDir">`,
    clientGroups: ` <label for="clientGroups">Client Groups:</label>
              <input type="text" placeholder="Groups" id="clientGroups" name="clientGroups">`,

    clientAuto: `
    Auto Start:
    <label for="Yes">Yes</label>
    <input type="radio" name="clientAuto" value="Yes"/>
    <label for="No">No</label>
    <input type="radio" name="clientAuto" value="No" checked/> 
    `,
  };
  let frag = new DocumentFragment();

  frag.appendChild(document.createElement("h1"));
  frag.querySelector("h1").textContent = "Add New Client";

  frag.append(document.createElement("form"));
  let select = document.createElement("select");
  select.innerHTML = ` <option value="Sonarr" selected>Sonarr</option>
    <option value="Radarr"option>Radarr</option>
   <option value="Rtorrent"option>Rtorrent</option>
     <option value="Qbittorrent"option>Qbittorrent</option>
     <option value="Transmission"option>Transmission</option>
     <option value="Nzbget"option>Nzbget</option>
     <option value="Sab"option>Sabnzbd</option>



  `;
  select.setAttribute("id", "clientType");
  select.setAttribute("name", "clientType");

  select.addEventListener("change", onSelectChange);
  let innerDiv = document.createElement("div");
  innerDiv.innerHTML = keys.reduce(
    (previous, curr) => previous + `<div>${options[curr]}</div><br>`,
    ""
  );
  let button = document.createElement("button");
  button.textContent = "Add Client";
  button.setAttribute("id", "torrent-quicksearch-downloadclients");

  frag.querySelector("form").appendChild(select);
  frag.querySelector("form").appendChild(innerDiv);
  frag.querySelector("form").appendChild(button);

  return frag;
}

function saveDownloadClient() {
  let wrapper = GM_config.fields["downloadclients"].wrapper;
  function verify(obj) {
    let keys = Object.keys(obj);
    optional=getOptional(obj["clientType"])
    for (let i in keys) {
      let key = keys[i];
      if (optional.has(key)) {
        continue;
      }
      if (obj[key] == null || obj[key] == "") {
        GM.notification(
          `Could Not Add Client: ${key} is missing`,
          program,
          searchIcon
        );
        return false;
      }
    }
    return true;
  }
  if (wrapper) {
    let inputs = Array.from(
      wrapper.querySelectorAll(
        "input[type='text'],input[type='password'],select,input[name='clientAuto']:checked"
      )
    );
    let val = JSON.parse(GM_config.getValue("downloadClients", "[]"));
    let outdict = {};
    outdict["clientID"] = Array(10)
      .fill()
      .map(() =>
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt(
          Math.random() * 62
        )
      )
      .join("");
    

    for (let i in inputs) {
      let ele = inputs[i];
      outdict[ele.name]= ele.value;
    }
    if (verify(outdict)) {
      val.push(outdict);
      GM_config.setValue("downloadClients", JSON.stringify(val));
    }
  }
}

function getCurrentDownloadClientsNode() {
  let parent = document.createElement("div");
  parent.setAttribute("id", "torrent-quicksearch-downloadclientsParent");
  let titleNode = document.createElement("h1");
  titleNode.textContent = "Current Clients";
  parent.append(titleNode);
  let clients = JSON.parse(GM_config.getValue("downloadClients", "[]"));
  for (let i in clients) {
    //delete button
    let button = document.createElement("button");
    button.setAttribute("class", "torrent-quicksearch-downloadclientsDelete");
    button.textContent = "Delete Client";
    button.addEventListener("click", deleteClient);
    parent.append(button);

    //client info box
    let client = clients[i];
    let keys = Object.keys(client);
    let section = document.createElement("div");
    section.setAttribute("class", "torrent-quicksearch-downloadclients");
    section.append();

    for (let j in keys) {
      let key = keys[j];
      let value = client[key];
      if (key=="clientPassword"){
        value=value.replace(/./g,"*")
      }
      let node = document.createElement("div");
      let keyNode = document.createElement("span");
      keyNode.textContent = `${key}: `;
      keyNode.style.display = "inline-block";
      keyNode.style.fontWeight = "bold";
      keyNode.style.marginRight = "5px";

      let valNode = document.createElement("span");
      valNode.textContent = `${value}`;
      valNode.style.display = "inline-block";
      node.append(keyNode);
      node.append(valNode);
      section.append(node);
    }

    parent.append(section);
  }
  return parent;
}
function deleteClient(e) {
  let clientNode = e.target.nextElementSibling;
  let clientID = Array.from(clientNode.childNodes).filter((e) =>
    e.textContent.match(/clientID/)
  )[0].childNodes[1].textContent;
  let clients = JSON.parse(GM_config.getValue("downloadClients", "[]"));
  GM_config.setValue(
    "downloadClients",
    JSON.stringify(clients.filter((e) => e.clientID != clientID))
  );
  recreateDownloadClientNode();
}

function recreateDownloadClientNode() {
  let wrapper = GM_config.fields["downloadclients"].wrapper;
  let oldChild = wrapper.querySelector(
    "#torrent-quicksearch-downloadclientsParent"
  );
  let newChild = getCurrentDownloadClientsNode();
  oldChild.parentElement.replaceChild(newChild, oldChild);
}

function downloadClientNode(configId) {
  var field = this.settings,
    id = this.id,
    create = this.create,
    retNode = create("div", {
      className: "config_var",
      id: configId + "_" + id + "_var",
      title: field.title || "",
    });
  let currentClients = getCurrentDownloadClientsNode();
  let newSubmissionForm = document.createElement("div");
  newSubmissionForm.setAttribute("id", "torrent-quicksearch-newclientWrapper");

  newSubmissionForm.appendChild(
    clientSubmissionGenerator(["clientName", "clientURL", "clientAPI"])
  );
  newSubmissionForm
    .querySelector("button")
    .addEventListener("click", addNewClient);
  retNode.appendChild(currentClients);
  retNode.appendChild(newSubmissionForm);

  return retNode;
}
function openMainMenu() {
  hideDisplay();
  resetResultList();
  resetSearchDOM();
  GM_config.setValue("oldSearchProgram",GM_config.get("searchprogram"))
  GM_config.setValue("oldSearchURL",GM_config.get("searchurl"))
  GM_config.setValue("oldSearchAPI",GM_config.get("searchapi"))
  document
    .querySelector("#torrent-quicksearch-overlay")
    .style.setProperty("--icon-size", `${iconLarge}%`);
  document
    .querySelector("#torrent-quicksearch-toggle")
    .removeEventListener("mousedown", leftClickProcess);
  document
    .querySelector("#torrent-quicksearch-toggle")
    .removeEventListener("mouseup", mouseUpProcess);

  searchObj.cancel();
}

function closeMainMenu() {
  document
    .querySelector("#torrent-quicksearch-overlay")
    .style.setProperty("--icon-size", `${iconSmall}%`);

  document
    .querySelector("#torrent-quicksearch-toggle")
    .addEventListener("mousedown", leftClickProcess);
  document
    .querySelector("#torrent-quicksearch-toggle")
    .addEventListener("mouseup", mouseUpProcess);
}

function saveMenu(){
  let bool1=GM_config.getValue("oldSearchProgram","")!=GM_config.get("searchprogram")
  let bool2=GM_config.getValue("oldSearchURL","")!=GM_config.get("searchurl")
  let bool3=GM_config.getValue("oldSearchAPI","")!=GM_config.get("searchapi")
  if(bool1 ||bool2||bool3){
    alert("Search Settings Updated\nPlease Select Indexers")
    GM_config.setValue("indexers",[])
    GM_config.fields.indexers.wrapper.querySelector("button").click()
  }
  GM_config.setValue("oldSearchProgram",GM_config.get("searchprogram"))
  GM_config.setValue("oldSearchURL",GM_config.get("searchurl"))
  GM_config.setValue("oldSearchAPI",GM_config.get("searchapi"))
  initFilterConfig()
}

function openFilterMenu(filterDocument) {
document.querySelector("#torrent-quicksearch-box").style.display = "none";
document.querySelector("#torrent-quicksearch-filter").style.display = "none";
  document
    .querySelector("#torrent-quicksearch-overlay")
    .style.setProperty("--icon-size", `${iconLarge}%`);
  document
    .querySelector("#torrent-quicksearch-toggle")
    .removeEventListener("mousedown", leftClickProcess);
  document
    .querySelector("#torrent-quicksearch-toggle")
    .removeEventListener("mouseup", mouseUpProcess);
  filterDocument.querySelector("#filterConfig_closeBtn").remove()

}
function closeFilterMenu() {
  filterResults( [...Array.from(document.querySelectorAll(".torrent-quicksearch-resultitem")),
  ...Array.from(document.querySelectorAll(".torrent-quicksearch-hiddenresultitem"))
]);

  document.querySelector("#torrent-quicksearch-box").style.display =
  "block";
  document.querySelector("#torrent-quicksearch-filter").style.display =
  "block";

  document
    .querySelector("#torrent-quicksearch-toggle")
    .addEventListener("mousedown", leftClickProcess);
  document
    .querySelector("#torrent-quicksearch-toggle")
    .addEventListener("mouseup", mouseUpProcess);
}
function saveFilterMenu(){
  filterconfig.close()
  closeFilterMenu()
}

function initMainConfig() {
  GM_config.init({
    id: "torrent-quick-search",
    title: "Torrent Quick Search Settings", // Panel Title
    fields: {
      searchprogram: {
        label: "Search Program",
        section: ["Search"],
        type: "select",
        options: ["Prowlarr", "Jackett", "NZBHydra2"],
        title: "Which search program",
      },
      searchurl: {
        label: "Search URL",
        type: "text",
        title: "Base URl for search program",
      },
      searchapi: {
        label: "API Key",
        type: "text",
        title: "API key for search program",
      },
  
      indexers: {
        type: "indexers",
      },
      sitefilter: {
        label: "Filter Current Site from results",

        type: "radio",
        options: ["true", "false"],
        title: "Should Results From Current Site be Filtered Out",
        default: "false",
      },

      'minSize': // This is the id of the field
      {
        'label': 'Size Min', // Appears next to field
        section: ["Default Filter Settings"],
        "labelPos" :"left",
        'title': "Min Size in GB",
        'type': 'int', // Makes this setting a text field
        'default': 0, // Default value if user doesn't change it
        'min':0
      },
      'maxSize': // This is the id of the field
      {
        'label': 'Size Max', // Appears next to field
        'title': "Max Size in GB\n-1 is inf",
        'type': 'int', // Makes this setting a text field
        'default': -1 ,// Default value if user doesn't change it,
        'min':-1
      },

      'minSeeders': // This is the id of the field
      {
        'label': 'Min Seeders', // Appears next to field
        'title': "Minimum Number of Seeders",
        'type': 'int', // Makes this setting a text field
        'default': 0, // Default value if user doesn't change it
        'min':0
      },
      'maxSeeders': // This is the id of the field
      {
        'label': 'Max Seeders', // Appears next to field
        'title': "Maximum Number of Seeders\n-1 is inf",
        'type': 'int', // Makes this setting a text field
        'default': -1, // Default value if user doesn't change it
        'min':-1
      },
      'minLeechers': // This is the id of the field
      {
        'label': 'Min Leechers', // Appears next to field
        'title': "Minimum Number of Leechers",
        'type': 'int', // Makes this setting a text field
        'default':0,// Default value if user doesn't change it
        'min':0
      },

      'maxLeechers': // This is the id of the field
      {
        'label': 'Max Leechers', // Appears next to field
        'title': "Maximum Number of Leechers\n-1 is inf",
        'type': 'int', // Makes this setting a text field
        'default': -1, // Default value if user doesn't change it
        'min':-1
      },
      'minFreeleech': // This is the id of the field
      {
        'label': 'Min Freeleechers', // Appears next to field
        'title': "Min Freeleech Percent Number",
        'type': 'int', // Makes this setting a text field
        'default': 0, // Default value if user doesn't change it
        'min':0,
        'max':100
      },
      "torrentDownload":
      {
        'label': 'Torrents', // Appears next to field
        'title': "Torrents",
        'type': 'checkbox', // Makes this setting a text field
        'default': true, // Default value if user doesn't change it
      },
      "nzbDownload":
      {
        'label': 'Nzb', // Appears next to field
        'title': "Nzbs",
        'type': 'checkbox', // Makes this setting a text field
        'default': true, // Default value if user doesn't change it
      },
      'olderThan': {
        'label': 'After: ',
        'type': 'date',
      },
      'youngerThan': {
        'label': 'Before: ',
        'type': 'date',
      },

      fontsize: {
        label: "Font Size",
        section: ["GUI"],
        type: "int",
        title: "fontsize",
        default: 12,
      },
  

      downloadclients: {
        section: ["Download Clients"],
        type: "downloadclient",
      },
    },
    types: {
      downloadclient: {
        default: null,
        toNode: downloadClientNode,
        toValue: function () {
          return;
        },
        reset: function () {
          GM_config.setValue("downloadClients", "[]");
        },
      },
      indexers: {
        default: null,
        toNode: editIndexersButtonNode,
        toValue: function () {
          return;
        },
        reset:function(){
          return
        }
      },
      'date': {
        'default': null,
          toNode: createDateNode,
          
          toValue: function() {
            if (this.wrapper) {
              return this.wrapper.querySelector("input").value
              }
            },
            reset: function() {
              // Empty all the input fields
              if (this.wrapper) {
                this.wrapper.querySelector("input").value=null
              }
            
  
    
          },
        
      }
    },
    events: {
      open: openMainMenu,
      close: closeMainMenu,
      save:  saveMenu
    },
    css: ` .torrent-quicksearch-downloadclients{
     border:solid black 5px;
     margin-bottom:5px;
  }
  .torrent-quicksearch-downloadclientsDelete,#torrent-quicksearch-downloadclientsAdd,#torrent-quicksearch-editIndexers,
  #torrent-quicksearch-testIndexer
  {
  margin-bottom:5px;
  background-color: gray;
  border: none;
  color: white;
  text-align: center;
  text-decoration: none;
  font-size: 20px;
  margin:5px;
  }
  `,
  });

  GM.registerMenuCommand("Torrent Quick Search Settings", function () {
    if (!filterconfig.isOpen){
      GM_config.open();
    }
  });
  
  
}
function initFilterConfig(){
  let parent= document.createElement('div');
  let title=document.createElement('div');
  title.style.fontSize="20pt"
  title.textContent="Temp Filter Settings"
  parent.append(title)
  let subtitle=document.createElement('div');
  subtitle.style.fontSize="10pt"
  subtitle.textContent="Change filter ettings for this search only"
  parent.appendChild(subtitle)
  
  

  filterconfig=new GM_configStruct(
    {
      'id': 'filterConfig', // You need to use a different id for each instance
      'title':parent,
      'fields': // Fields object
      {
        'minSize': // This is the id of the field
        {
          'label': 'Size Min', // Appears next to field
          'title': "Min Size in GB",
          'type': 'int', // Makes this setting a text field
          'default': GM_config.get("minSize"), // Default value if user doesn't change it
          'min':0
        },
        'maxSize': // This is the id of the field
        {
          'label': 'Size Max', // Appears next to field
          'title': "Max Size in GB\n-1 is inf",
          'type': 'int', // Makes this setting a text field
          'default': GM_config.get("maxSize") ,// Default value if user doesn't change it,
          'min':-1
        },
  
        'minSeeders': // This is the id of the field
        {
          'label': 'Min Seeders', // Appears next to field
          'title': "Minimum Number of Seeders",
          'type': 'int', // Makes this setting a text field
          'default': GM_config.get("minSeeders") , // Default value if user doesn't change it
          'min':0
        },
        'maxSeeders': // This is the id of the field
        {
          'label': 'Max Seeders', // Appears next to field
          'title': "Maximum Number of Seeders\n-1 is inf",
          'type': 'int', // Makes this setting a text field
          'default': GM_config.get("maxSeeders") , // Default value if user doesn't change it
          'min':-1
        },
        'minLeechers': // This is the id of the field
        {
          'label': 'Min Leechers', // Appears next to field
          'title': "Minimum Number of Leechers",
          'type': 'int', // Makes this setting a text field
          'default':GM_config.get("minLeechers") ,// Default value if user doesn't change it
          'min':0
        },
  
        'maxLeechers': // This is the id of the field
        {
          'label': 'Max Leechers', // Appears next to field
          'title': "Maximum Number of Leechers\n-1 is inf",
          'type': 'int', // Makes this setting a text field
          'default': GM_config.get("maxLeechers"), // Default value if user doesn't change it
          'min':-1
        },
        'minFreeleech': // This is the id of the field
        {
          'label': 'Min Freeleechers', // Appears next to field
          'title': "Min Freeleech Percent Number",
          'type': 'int', // Makes this setting a text field
          'default': GM_config.get("minFreeleech"), // Default value if user doesn't change it
          'min':0,
          'max':100
        },
        'olderThan': {
          'label': 'After: ',
          'type': 'date',
          'default':GM_config.get("olderThan")
        },
        'youngerThan': {
          'label': 'Before: ',
          'type': 'date',
          'default':GM_config.get("youngerThan")
        },
        "torrentDownload":
        {
          'label': 'Torrents', // Appears next to field
          'section':["Download Type"],
          'title': "Torrents",
          'type': 'checkbox', // Makes this setting a text field
          'default': GM_config.get("torrentDownload") // Default value if user doesn't change it
        },
        "nzbDownload":
        {
          'label': 'Nzb', // Appears next to field
          'title': "Nzbs",
          'type': 'checkbox', // Makes this setting a text field
          'default': GM_config.get("nzbDownload"), // Default value if user doesn't change it
        },
    
    
  
  
    },
    'types':
    {
      'date': {
        'default': null,
          toNode: createDateNode,
          
          toValue: function() {
            if (this.wrapper) {
              return this.wrapper.querySelector("input").value
              }
            },
            reset: function() {
              // Empty all the input fields
              if (this.wrapper) {
                this.wrapper.querySelector("input").value=null
              }
            
  
    
          },
        
      }},
      events: {
          open: openFilterMenu,
          close: closeFilterMenu,
          save: saveFilterMenu
        }
  });
}

let filterconfig=null
function verifyConfig() {
  if (
    GM_config.get("searchapi", "null") == "null" ||
    GM_config.get("searchurl", "null") == "null"
  ) {
    return false;
  }

  if (
    GM_config.get("searchapi", "null") == "" ||
    GM_config.get("searchurl", "null") == ""
  ) {
    return false;
  }
  return true;
}

function getOptional(clientType){
  switch (clientType) {    
    case "Rtorrent":
          return new Set(["clientLabel","undefined","clientUserName","clientPassword","clientDir"]);    
    case "Qbittorrent":
      return new Set(["clientCategory","undefined","clientUserName","clientPassword","clientDir","clientTags"]);         
    case "Transmission":
      return new Set(["clientCategory","undefined","clientUserName","clientPassword","clientTags"]);         
      case "Nzbget":
        return new Set(["undefined","clientUserName","clientPassword","clientTags"]); 
        default:
      return new Set(["undefined"]);      
      } 
          }  
  
  

  
 


          function editIndexerFactory(){
            return async function editIndexers(e){
              let indexerList= await getIndexers() ||[]
              var gmc = new GM_configStruct({
                id: 'torrent-quicksearch-indexers', 
                title: "Torrent Quick Search Indexers", 
               fields: {
              indexers: {
                type: "indexers",
              }},
              events:{
                'save': function() { 
                  alert("Indexers Updated"); 
                  GM_config.fields.indexers.wrapper.querySelector("h4").textContent=`${GM_config.getValue(`indexers`,[]).length} Indexers Selected`
                  if(GM_config.getValue("indexers",[]).length==0){
                    alert("No Indexers Selected")
                  }
                  gmc.close()
                  
                },
                "open":function(document){
                  document.querySelector("#torrent-quicksearch-indexers_closeBtn").remove()
                }
              },
              types: {
                indexers: {
                  default: null,
                  toNode: function(configId){
                    let searchprogram=GM_config.get("searchprogram", "")


                  var field = this.settings,
                    id = this.id,
                    create = this.create,
                    retNode = create("div", {
                      className: "config_var",
                      id: configId + "_" + id + "_var",
                      title: field.title || "",
                    });

                    let h3=document.createElement("h3")
                    h3.textContent=`${GM_config.fields.searchprogram.node.value} Indexers Selection`
                    retNode.appendChild(h3)
                    if (indexerList.length==0){
                      let h4=document.createElement("h4")
                      h4.textContent="No Indexers"
                      retNode.appendChild(h4)
                    }
                    let span=document.createElement("span")
                    let selectall=document.createElement("button")
                    selectall.setAttribute("id", "torrent-quicksearch-selectallindexers");
                    selectall.textContent="Select all" 
                    selectall.addEventListener("click",()=>{
                      Array.from(this.wrapper.querySelectorAll('input')).forEach((e)=>e.checked=true)

                    })
                    let removeall=document.createElement("button")
                    removeall.setAttribute("id", "torrent-quicksearch-selectallindexers");
                    removeall.textContent="Remove all" 
                    removeall.addEventListener("click",()=>{
                      Array.from(this.wrapper.querySelectorAll('input')).forEach((e)=>e.checked=false)
                    })
                    span.appendChild(selectall)
                    span.appendChild(removeall)
                    retNode.appendChild(span)
                    let form=document.createElement("form")
                    const set = new Set(GM_config.getValue(`indexers`,[]).map((e)=>e["ID"]));
                    for(i in indexerList){
                      let checkbox=document.createElement("input")

                      checkbox.setAttribute("type","checkbox")
                      checkbox.setAttribute("ID",indexerList[i]["ID"])
                      checkbox.setAttribute("Name",indexerList[i]["Name"])
                      if (set.has(String(indexerList[i]["ID"]))){
                        checkbox.setAttribute("checked",true)
                      }
                      form.appendChild(checkbox)
                      let label=document.createElement("label")
                      label.setAttribute("for",indexerList[i]["Name"])
                      label.textContent=indexerList[i]["Name"]
                      form.appendChild(label)
                      let breakNode=document.createElement("br")
                      form.appendChild(breakNode)

                    }
                    retNode.appendChild(form)

                
                    
                    return retNode





                  
                  },
                  toValue: function () {
                    let searchprogram=GM_config.get("searchprogram", "")
                    if (this.wrapper) {
                      let inputs = Array.from(this.wrapper.querySelectorAll('input')).filter((e)=>e.checked==true).map(
                        (e)=>{
                          return {"ID":e.getAttribute("ID"),"Name":e.getAttribute("Name")}
                        }
                        )
                      GM_config.setValue(`indexers`,inputs)
                  }},
                  reset: function () {
                    GM_config.setValue("indexerVal", "[]");
                  },
                }
             }
            }
             
             );
              e.preventDefault()
              e.stopPropagation()
              gmc.open()
            }
           
          }
          
          function editIndexersButtonNode(configId){
            var field = this.settings,
              id = this.id,
              create = this.create,
              retNode = create("div", {
                className: "config_var",
                id: configId + "_" + id + "_var2",
                title: field.title || "",
              });
              let span=document.createElement("span")
              let button=document.createElement("button")
              let button2=document.createElement("button")
              let indexCounter=document.createElement("h4")
              indexCounter.textContent=`${GM_config.getValue(`indexers`,[]).length} Indexers Selected`
              span.appendChild(button)
              span.appendChild(button2)
              span.appendChild(indexCounter)

              retNode.appendChild(span)
              button.setAttribute("id", "torrent-quicksearch-editIndexers");
              button.textContent="Edit Indexers" 
              button2.setAttribute("id", "torrent-quicksearch-testIndexer");
              button2.addEventListener("click",testIndexerEvent)
              button2.textContent="Test Search Settings" 
              editIndexerEvent=editIndexerFactory()
              button.addEventListener("click",editIndexerEvent)
              return retNode    
          }

  function resetConfig(config){
    let fields=config.fields
    for (let i in fields){
      let field=fields[i]
      if(config.getValue(field.id)){
        config.setValue(field.id,field.default)
      }
      else{
        config.set(field.id,field.default)
      }
    }
  }
          
    
  function createDateNode(configId){
      var field = this.settings,
      value = this.value,
      id = this.id,
      create = this.create,
      retNode = create("div", {
        className: "config_var",
        id: configId + "_" + id + "_var",
        title: field.title || "",
      });
      let input=document.createElement("input")
      input.setAttribute("type","date")
      input.setAttribute("name",id)
      input.setAttribute("id",`${id}-torrent-quicksearch`)
      input.value=value
      let label=document.createElement("label")
      label.textContent=field.label
      label.setAttribute("for",`${id}-torrent-quicksearch`)
      retNode.appendChild(label)
      retNode.appendChild(input)   
      return retNode;
  }

 

     
