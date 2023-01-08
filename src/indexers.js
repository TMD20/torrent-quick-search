function getSearchURLProwlarr(indexer) {
  let params = new URLSearchParams();
  params.append("apikey", GM_config.get("searchapi"));
  params.append(
    "query",
    `${document.querySelector("#torrent-quicksearch-customsearch").value}`
  );
  params.append("IndexerIds", indexer);
  let baseURL = new URL(
    "/api/v1/search",
    GM_config.get("searchurl")
  ).toString();
  return `${baseURL}?${params.toString()}`;
}

function getSearchURLJackett(indexer) {
  let params = new URLSearchParams();
  params.append("apikey", GM_config.get("searchapi"));
  params.append(
    "Query",
    `${document.querySelector("#torrent-quicksearch-customsearch").value}`
  );
  let baseURL = new URL(
    `/api/v2.0/indexers/${indexer}/results`,
    GM_config.get("searchurl")
  ).toString();
  params.append("cachetime", "20");
  return `${baseURL}?${params.toString()}`;
}

function getSearchURLHydraNZB(indexer) {
  let params = new URLSearchParams();
  params.append("apikey", GM_config.get("searchapi"));
  params.append(
    "q",
    `${document.querySelector("#torrent-quicksearch-customsearch").value}`
  );
  params.append("indexers", indexer);
  params.append("t", "search");
  params.append("o", "xml");
  params.append("cachetime", "20");
  let baseURL = new URL("/api", GM_config.get("searchurl")).toString();
  return `${baseURL}?${params.toString()}`;
}

function getSearchURLHydraTor(indexer) {
  let params = new URLSearchParams();
  params.append("apikey", GM_config.get("searchapi"));
  params.append(
    "q",
    `${document.querySelector("#torrent-quicksearch-customsearch").value}`
  );
  params.append("indexers", indexer);
  params.append("t", "search");
  params.append("o", "xml");
  //hydra likes to send no data
  params.append("cachetime", "20");
  let baseURL = new URL("/torznab/api", GM_config.get("searchurl")).toString();

  return `${baseURL}?${params.toString()}`;
}

async function getIndexers({searchprogram=GM_config.get("searchprogram"),searchapi= GM_config.get("searchapi"),searchurl=GM_config.get("searchurl")} = {}) {
  document.querySelector("#torrent-quicksearch-msgnode").textContent =
    "Getting Indexers";
  let indexers = null;
  if (searchprogram == "Prowlarr") {
    indexers = await getIndexersProwlarr({searchapi:searchapi,searchurl:searchurl});
  } else if (searchprogram == "Jackett") {
    indexers = await getIndexersJackett({searchapi:searchapi,searchurl:searchurl});
  } else if (searchprogram == "NZBHydra2") {
    indexers = await getIndexersHydra({searchapi:searchapi,searchurl:searchurl});
  }
  return indexers
}

async function getIndexersJackett({searchapi= GM_config.get("searchapi"),searchurl=GM_config.get("searchurl")} = {}) {
 
  let params = new URLSearchParams();
  params.append("apikey", searchapi);
  //Invalid Category Search
  params.append("Category[]", 20130);
  params.append("Query", "''");
  let baseURL = new URL(
    `/api/v2.0/indexers/all/results`,
    `${searchurl}`
  ).toString();
  let indexerURL = `${baseURL}?${params.toString()}`;
  let req = await fetch(indexerURL,{"semaphore":false});
  if (req.status!=200){
    return null
  }
  let data = JSON.parse(req.responseText)["Indexers"];
  let output = data.map((e) => {
    let dict = {};
    dict["Name"] = e["Name"];
    dict["ID"] = e["ID"];
    return dict;
  });
  return output;
}

async function getIndexersProwlarr({searchapi= GM_config.get("searchapi"),searchurl=GM_config.get("searchurl")} = {}) {
  let params = new URLSearchParams();
  params.append("apikey", searchapi);

  let baseURL = new URL(
    `/api/v1/indexer`,
    `${searchurl}`
  ).toString();

  let indexerURL = `${baseURL}?${params.toString()}`;
  let req = await fetch(indexerURL,{"semaphore":false});
  if (req.status!=200){
    return null
  }
  let data = JSON.parse(req.responseText);
  data = data.sort(prowlarIndexSortHelper);
  let output = data.map((e) => {
    let dict = {};
    dict["Name"] = e["name"];
    dict["ID"] = e["id"];
    return dict;
  });

  return output;
}

function prowlarIndexSortHelper(a, b) {
  if (a["priority"] > b["priority"]) {
    return -1;
  }
  if (a["priority"] < b["priority"]) {
    return 1;
  }
  return 0;
}

async function getIndexersHydra({searchapi= GM_config.get("searchapi"),searchurl=GM_config.get("searchurl")} = {}) {
  let params = new URLSearchParams();
  params.append("apikey", searchapi);
  let baseURL = new URL(
    `/api/stats/indexers/`,
    `${searchurl}`
  ).toString();
  let indexerURL = `${baseURL}?${params.toString()}`;
  let req = await fetch(indexerURL,{"semaphore":false});
  if (req.status!=200){
    return null
  }
  let data = JSON.parse(req.responseText);
  let output = data.map((e) => {
    let dict = {};
    dict["Name"] = e["indexer"];
    dict["ID"] = e["indexer"];
    return dict;
  });

  return output;
}

function getSelectedIndexers(){
  return GM_config.getValue(`indexers`,[]);
}


