async function getIndexers() {
  document.querySelector("#torrent-quicksearch-msgnode").textContent =
    "Getting Indexers";
  let searchprogram = GM_config.get("searchprogram");
  let indexers = null;
  if (searchprogram == "Prowlarr") {
    indexers = await getIndexersProwlarr();
  } else if (searchprogram == "Jackett") {
    indexers = await getIndexersJackett();
  } else if (searchprogram == "NZBHydra2") {
    indexers = await getIndexersHydra();
  }

  await indexerCacheHelper(indexers);
  return await listFilter(indexers);
}

async function getIndexersJackett() {
  let key = "jackettIndexers";
  let cachedIndexers = await GM.getValue(key, "none");
  if (cachedIndexers == "none") {
    null;
  } else if (Date.now() - (cachedIndexers?.date || 0) < day) {
    return cachedIndexers["indexers"];
  }
  let params = new URLSearchParams();
  params.append("apikey", GM_config.get("searchapi"));
  //Invalid Category Search
  params.append("Category[]", 20130);
  params.append("Query", "''");
  let baseURL = new URL(
    `/api/v2.0/indexers/all/results`,
    `${GM_config.get("searchurl")}`
  ).toString();
  let indexerURL = `${baseURL}?${params.toString()}`;
  let req = await fetch(indexerURL);
  let data = JSON.parse(req.responseText)["Indexers"];
  let output = data.map((e) => {
    let dict = {};
    dict["Name"] = e["Name"];
    dict["ID"] = e["ID"];
    return dict;
  });
  await GM.setValue(key, {
    date: Date.now(),
    indexers: output,
  });
  return output;
}

async function getIndexersProwlarr() {
  let key = "prowlarrIndexers",
    cachedIndexers = await GM.getValue(key, "none");
  if (cachedIndexers == "none") {
    null;
  } else if (Date.now() - (cachedIndexers?.date || 0) < day) {
    return cachedIndexers["indexers"];
  }
  let params = new URLSearchParams();
  params.append("apikey", GM_config.get("searchapi"));

  let baseURL = new URL(
    `/api/v1/indexer`,
    `${GM_config.get("searchurl")}`
  ).toString();

  let indexerURL = `${baseURL}?${params.toString()}`;
  let req = await fetch(indexerURL);
  let data = JSON.parse(req.responseText);
  data = data.sort(prowlarIndexSortHelper);
  let output = data.map((e) => {
    let dict = {};
    dict["Name"] = e["name"];
    dict["ID"] = e["id"];
    return dict;
  });
  await GM.setValue(key, {
    date: Date.now(),
    indexers: output,
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

async function getIndexersHydra() {
  let key = "hydraIndexers";
  let cachedIndexers = await GM.getValue(key, "none");
  if (cachedIndexers == "none") {
    null;
  } else if (Date.now() - (cachedIndexers?.date || 0) < day) {
    return cachedIndexers["indexers"];
  }
  let params = new URLSearchParams();
  params.append("apikey", GM_config.get("searchapi"));
  let baseURL = new URL(
    `/api/stats/indexers/`,
    `${GM_config.get("searchurl")}`
  ).toString();
  let indexerURL = `${baseURL}?${params.toString()}`;
  let req = await fetch(indexerURL);
  let data = JSON.parse(req.responseText);
  let output = data.map((e) => {
    let dict = {};
    dict["Name"] = e["indexer"];
    dict["ID"] = e["indexer"];
    return dict;
  });

  await GM.setValue(key, {
    date: Date.now(),
    indexers: output,
  });
  return output;
}

async function listFilter(allIndexers) {
  let selectedIndexers = null;
  if (GM_config.get("listType") == "black") {
    selectedIndexers = await blackListHelper(allIndexers);
  } else {
    selectedIndexers = await whiteListHelper(allIndexers);
  }

  let output = [];

  for (let i in allIndexers) {
    if (selectedIndexers.has(allIndexers[i]["ID"])) {
      output.push(allIndexers[i]);
    }
  }

  return output;
}

async function indexerCacheHelper(allIndexers) {
  if (GM_config.get("indexers") == "") {
    return;
  }
  let searchprogram = GM_config.get("searchprogram");
  let indexerNames = GM_config.get("indexers")
    .split(",")
    .map((e) => e.trim().toLowerCase());
  for (let j in indexerNames) {
    let key = `${searchprogram}_${indexerNames[j]}`;
    let cached = await GM.getValue(key, "none");
    if (cached != "none") {
      continue;
    }
    for (let i in allIndexers) {
      if (allIndexers[i]["Name"].match(new RegExp(indexerNames[j], "i"))) {
        await GM.setValue(key, allIndexers[i]["ID"]);
      }
    }
  }
}

async function blackListHelper(allIndexers) {
  let indexerID = new Set(allIndexers.map((e) => e["ID"]));
  let indexerNames = GM_config.get("indexers")
    .split(",")
    .map((e) => e.trim());
  let searchprogram = GM_config.get("searchprogram");

  for (let j in indexerNames) {
    let key = `${searchprogram}_${indexerNames[j]}`;
    let cached = await GM.getValue(key, "none");
    if (cached != "none") {
      indexerID.delete(cached);
    }
  }
  return indexerID;
}

async function whiteListHelper(allIndexers) {
  let indexerID = new Set();
  let indexerNames = GM_config.get("indexers")
    .split(",")
    .map((e) => e.trim());
  let searchprogram = GM_config.get("searchprogram");

  for (let j in indexerNames) {
    let key = `${searchprogram}_${indexerNames[j]}`;
    let cached = await GM.getValue(key, "none");
    if (cached != "none") {
      indexerID.add(cached);
    }
  }
  return indexerID;
}
