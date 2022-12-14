Creates a quick search toggle powered by search aggregator such as prowlarr. Searches results are embedded in a floating window, so no need to switch tabs/windows to view them.  Searches can be conducted on numerous supported sites. On any page that corresponds to a single title

We can also customize results by filtering indexers that we don't want, or we can do a whitelist and only add indexer we want. Additionally on tracker sites we are also able to filter results from the current site. 

The toggle shrinks when not in use, and can be moved around if desired

# Features
* Toggle Search based on info gathered on Page
* Resizable+Moveable Element
* Can Send downloads directly to clients
* Can Store Multiple clients 
* Supports Multiple Search Aggregator
* Faster Results through Concurrent searching
  - Up to 10 request at once
  - Results are available for each indexers as soon as they return
  - Slow indexers won't block
* Option to change Search query via customsearchbox
* Indexer Whitelist or Blacklist




# Suported Sites
* Blutopia
* Animebytes
* BHD
* IMDB
* TMDB

 # Supported Search Aggregators
* Prowlarr
* Jackett
* Hydra

# Clients Supported
* Sonarr
* Radarr
* Rtorrent
* Qbittorrent
* Transmission
* Sabnzbd
* Nzbget

# How Use
* Go to Supported Site
* Make Sure to use your script manager to setup required settings
This can usually be done by clicking on icon in menu
Required Settings
  * Search URL
  * Search Program
  * Search API
 * Click Icon when your on a title page
    * For example movie's main page
    * A page for a single torrent

# Settings

Required 
* Search URL: example localhost:9118
* Search API Key: a string generated by search program

Optional
* indexer: can match search program names with only part of the name, or a substring
* filter current site: For private trackers if you want to not see results from the current tracker


# Adding Clients

Arr Clients Required Settings
* clientType
* clientName
* clientAPI
* clientURL

similar idea to search program settings

clients are added when you click the save button



# Gallery 

![image](https://user-images.githubusercontent.com/109320934/197426136-949dd2fb-4888-4429-9dc6-7baeaa3f5a75.png)

![image](https://user-images.githubusercontent.com/109320934/197426269-fcc31092-fb47-49ac-b81e-1150fcf48e69.png)





