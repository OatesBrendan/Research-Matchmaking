const axios = require('axios');

const baseURL = 'https://pub.orcid.org/v3.0/';

// requests based on query and returns json response
const requestDataFromOrcid = async (query) => {
    const url = baseURL + query;
    const headers = { 'Accept': 'application/json' };
    return await axios.get(url, { headers });
}

// finds and returns a researchers publications from orcid
const getResearcherPubs = async (orcid) => {
    // request general information on researchers publications
    const response = await requestDataFromOrcid(`${orcid}/works`);

    if (response.status !== 200) return { success: false, code: response.status, error: "Bad Request." };

    // get the ids to fetch more indepth details on their publications
    const put_ids = [];
    response.data.group.map(work => {
        put_id = work['work-summary'][0]['put-code'];
        put_ids.push(put_id);
    });

    const pubs = [];

    // helper function to get the detailed response from orcid API of the array of ids given
    // adds them to the pubs array
    async function addPublications(ids) {
        const detailed_response = await requestDataFromOrcid(`${orcid}/works/${ids.toString()}`);
        if (detailed_response.status != 200) throw new Error('Failed to get publications');
        const works = detailed_response.data.bulk;

        if(!works) return;

        works.map(work => {
            publication = work.work;
            const title = publication.title.title.value;
            const date = publication['publication-date']
            const year = date?.year?.value || 'n.d.';
            const url = publication.url;
            const contributors = publication.contributors?.contributor || [];

            const contributor_names = contributors.map(contributor => (
                contributor?.['credit-name']?.value || 'Unknown'
            ));

            pubs.push({
                title,
                year,
                tags: [],
                url: url?.value,
                authors: contributor_names,
            });
        })
    }

    // the detailed works route can only support 100 ids at a time.
    try {
        if (put_ids.length > 100) {
            let start_index = 0;
            while (start_index < put_ids.length) {
                const end_index = Math.min(start_index + 100, put_ids.length);
                const batch = put_ids.slice(start_index, end_index);
                await addPublications(batch);
                start_index = end_index;
            }
        } else {
            await addPublications(put_ids);
        }
    } catch (error) {
        console.warn(error);
        return { success: false, code: 500, error: error };
    }

    return { success: true, publications: pubs };
};

// gets the researchers details from orcid in same format as Researcher Schema
const getResearcherDetails = async (orcid) => {
    const response = await requestDataFromOrcid(`${orcid}/person`);

    if (response.status !== 200) return { success: false, code: response.status, error: "Bad Request." };

    const person = response.data;

    const researcher = {
        name: `${person.name['given-names']?.value.trim() || ''} ${person.name['family-name']?.value.trim() || ''}`.trim(),
        institution: await getInstitution(orcid),
        researchTopics: getKeywords(person),
        researchAreas: [],
        orcid: orcid,
        publications: []
    }

    return { success: true, researcher };
}

const getInstitution = async (orcid) => {
    const response = await requestDataFromOrcid(`${orcid}/employments`);
    const employments = response.data['affiliation-group'] || [];

    return employments[0]?.summaries[0]?.['employment-summary']?.organization?.name || 'Unknown';
}

const getKeywords = (person) => {
    return person.keywords?.keyword.map(k => k.content) || [];
}

module.exports = {
    getResearcherPubs,
    getResearcherDetails,
}