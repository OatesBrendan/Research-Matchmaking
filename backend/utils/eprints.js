const Publication = require('../models/publicationModel');
const Researcher = require('../models/researcherModel');
const axios = require('axios');
const {parseStringPromise} = require('xml2js');


// Get researcher info from eprints
async function getPublications(url) {
  try {
    
    const response = await axios.get(url);
    
    const xml = response.data;

    // Convert XML → JS object
    const data = await parseStringPromise(xml);
    //console.log(data);

    // Navigate to RSS items
    const items = data["rdf:RDF"].item;
    if(items==null){
      return [];
    }

    const publications = items.map(entry => ({
      title: entry.title[0],
      id: entry.link[0].split(".au/")[1].split("/")[0]
    }));

    for (const pub of publications) {
      pub.link = `https://eprints.qut.edu.au/cgi/export/${pub.id}/DC/quteprints-eprint-${pub.id}.txt`;
      pub.description = null;
    }

    //console.log(publications);
    return publications;
  } catch (err) {
    return -1;
  }
}


// Get publication data from rss files
async function getPublicationDescriptions(researcherId) {

    const researcher = await Researcher.findById(researcherId);
    if (!researcher) {
      throw new Error("Researcher not found");
    }
    
    const firstName = researcher.name.split(" ")[0];
    const lastName = researcher.name.split(" ")[1];

    let url;
    let newEprintsLink;
    
    if(!researcher.eprintsLink){
      url = `https://eprints.qut.edu.au/cgi/exportview/person/${lastName},_${firstName}/RSS/${lastName},_${firstName}.rss`;
      newEprintsLink = `${lastName},_${firstName}/RSS/${lastName},_${firstName}.rss`;
    } else {
      url = `https://eprints.qut.edu.au/cgi/exportview/person/${researcher.eprintsLink}.rss`;
    }
    const publications = await getPublications(url);

    // Fetch each publication's description
    try {
      if(publications !== -1){
        if(publications != []){
          await Researcher.findByIdAndUpdate(researcherId, {eprintsLink: newEprintsLink});
        }
        const stuff = await Promise.all(publications.map(async (pub) => {
            const response = await axios.get(pub.link);
            const data = response.data;
            let found = false;
            data.trim().split("\n").forEach(line => {
              if(!found) {
                if (line.startsWith("description:")) {
                    pub.description = line.replace("description:", "").trim();
                    found = true;
                }
                if (line.startsWith("abstract:")) {
                    pub.description = line.replace("description:", "").trim();
                    found = true;
                }
              }
            });
            return pub;
        }));
        

        // Filter out any null results
        descriptions = stuff.filter(desc => desc.description !== null);
        
        return descriptions;
      } else {
        return -1;
      }
    } catch (err) {
      console.error("Error fetching publication descriptions:", err.message);
      return -1;
    }
}



module.exports = {
  getPublications,
  getPublicationDescriptions,
};