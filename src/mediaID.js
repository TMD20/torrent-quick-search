function getTitle() {
  let titleNodes = Array.from(document.querySelectorAll(siteParser["title"]));
  let title = titleNodes.reduce((accumulator, currentValue) => { 
    if (currentValue==null){
      return accumulator
    }
    return accumulator+currentValue[siteParser["titleAttrib"]]
  },"")
    
  title = titleCleanup(title);
  return title;
}

function titleCleanup(title) {
  title = title.trim().replaceAll(/\n/g, "");
  title = title.replaceAll(/ +/g, " ");
  return title;
}

function imdbCleanup(imdb) {
  if (imdb === null || imdb === undefined || imdb === 0 || imdb === "0") {
    return imdb;
  }
  imdb = String(imdb);
  imdb = imdb.match(/[0-9]+/).toString();
  imdb = imdb.trim().replaceAll(/\n/g, "");
  imdb = imdb.replace(/imdb/i, "");
  imdb = imdb.replace(/tt/, "");
  imdb = imdb.replace(/[:|&|*|\(|\)|!|@|#|$|%|^|\*|\\|\/]/, "");
  imdb = imdb.replaceAll(/ +/g, "");
  imdb = imdb.replace(/^0+/, "");
  imdb = parseInt(imdb);
  return imdb;
}

function imdbFilter(entry, imdb) {
  if (imdb === null || imdb === "IMDB Not Provided") {
    return true;
  } else if (entry["ImdbId"] == 0) {
    return true;
  } else if (entry["ImdbId"] == imdb) {
    return true;
  }
  return false;
}
async function tmdbExternalMedia(type, id) {
  let key = tmdbapi
  let baseURL = new URL(
    `/3/movie/${id}/external_ids`,
    `https://api.themoviedb.org`
  ).toString();
  let params = new URLSearchParams();
  params.append("api_key", key);
  if (type == "tv") {
    baseURL = new URL(
      `/3/tv/${id}/external_ids`,
      `https://api.themoviedb.org`
    ).toString();
  }

  let searchURL = `${baseURL}?${params.toString()}`;
  let req = await fetch(searchURL);
  return JSON.parse(req.responseText);
}

async function imdbTMDBConvertor(imdb) {
  let key = tmdbapi
  imdb = String(imdb);
  if (key == "null") {
    return null;
  }
  if (imdb.match(/tt/i) == null) {
    imdb = `tt${imdb}`;
  }
  let baseURL = new URL(
    `/3/find/${imdb}`,
    `https://api.themoviedb.org`
  ).toString();
  let params = new URLSearchParams();

  params.append("api_key", key);
  params.append("external_source", "imdb_id");
  let searchURL = `${baseURL}?${params.toString()}`;
  let req = await fetch(searchURL);
  let data = JSON.parse(req.responseText);
  let output = data["tv_results"];
  if (data["movie_results"].length > output.length)
    output = data["movie_results"];
  return output[0];
}
// First call to tmdbapi should be removed once we parse Movies vs TV

async function tmdbTVDBConvertor(imdb) {
  let helperData = await imdbTMDBConvertor(imdb);
  if (helperData == null) {
    return;
  } else if (helperData["media_type"] == "tv") {
    return (await tmdbExternalMedia("tv", helperData.id))["tvdb_id"];
  } else if (helperData["media_type"] == "movie") {
    return (await tmdbExternalMedia("movie", helperData.id))["tvdb_id"];
  }
}

async function tmdbPageIMDBParser() {
  let id = window.location.href
    .match(/\/[0-9]+/)
    .toString()
    .substring(1);
  if (window.location.href.match(/\/tv\//)) {
    return (await tmdbExternalMedia("tv", id))["imdb_id"];
  } else {
    return (await tmdbExternalMedia("movie", id))["imdb_id"];
  }
}
