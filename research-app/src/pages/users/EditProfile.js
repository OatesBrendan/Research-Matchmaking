import React, { useCallback, useEffect } from 'react';
import '../../styles/browse-profiles.css';
import { researcherService } from '../../services/researcherService';
import { userService } from '../../services/userService';
import { tagService } from '../../services/tagService';
import Select from "react-dropdown-select";
import { navigate } from '../../services/navigationService';


const EditProfile = () => {
  // State to track if the form has been updated, controls the save changes button
  const [update, setUpdate] = React.useState(false);

  // list of research areas
  const [researchAreasList, setResearchAreasList] = React.useState([]);
  const [options, setOptions] = React.useState([]);

  const [userFormData, setUserFormData] = React.useState({
    name: '',
    email: '',
    researchAreas: [],
    technicalSkills: []
  });

  const [initialState, setInitialState] = React.useState(userFormData);

  const [userId, setUserId] = React.useState('');

  const [researchArea, setResearchArea] = React.useState(
    ''
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let updateData = {};
    if(userFormData.name !== initialState.name){
      updateData.name = userFormData.name;
    }
    if(userFormData.email !== initialState.email){
      updateData.email = userFormData.email;
    }
    if(userFormData.researchAreas !== initialState.researchAreas){
      updateData.researchAreas = userFormData.researchAreas;
    }
    if(userFormData.technicalSkills !== initialState.technicalSkills){
      updateData.technicalSkills = userFormData.technicalSkills;
    }

    if(Object.keys(updateData).length === 0){
    
      alert('Please fill in all required fields');
      loadUserProfile();
      return;
    
    }

 
    try {
      const res = await researcherService.updateResearcher(userId, updateData);
      
      if (res.success === true) {
        setUpdate(false);
        setInitialState(userFormData);
        alert('Profile updated successfully');
      } else {
        setUserFormData(initialState);
        alert('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('An error occurred while updating your profile. Please try again later.');
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdate(true);
    setUserFormData({
      ...userFormData,
      [name]: value
    });

  }

  const handleResearchAreaChange = (e) => {
    setResearchArea(e.target.value);
  }


  const handleRemoveResearchArea = (areaToRemove) => {
    setUserFormData({
      ...userFormData,
      researchAreas: userFormData.researchAreas.filter(area => area !== areaToRemove)
    });
    setUpdate(true);
  }

  const handleRemoveTechnicalSkill = (skillToRemove) => {
    setUserFormData({
      ...userFormData,
      technicalSkills: userFormData.technicalSkills.filter(skill => skill !== skillToRemove)
    });
    setUpdate(true);

  }


  const handleAddResearchArea = () => {
    if (researchArea !== '') {

      setUserFormData({
        ...userFormData,
        researchAreas: [...userFormData.researchAreas, researchArea]
      });
      setResearchArea('');
      setUpdate(true);
    }
  };

  const handleAddSkill = (selectedSkills) => {
    // selectedSkills is an array of {label, value}
    const skillValues = selectedSkills.map(skill => skill.value);
    setUserFormData({
      ...userFormData,
      technicalSkills: [...userFormData.technicalSkills, ...skillValues]
    });
    setUpdate(true);
  };

  const loadTags = useCallback(async () => {
    try {
      const [responseAreas, responseSkills] = await Promise.all([
        tagService.getResearchAreas(),
        tagService.getTechnicalSkills()
      ]);

      setResearchAreasList(responseAreas.areas);
      const optionsMap = responseSkills.skills.filter(skill => {
        return !userFormData.technicalSkills.includes(skill);
      }).map(skill => { return { label: skill, value: skill } });
      setOptions(optionsMap);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  }, [userFormData])

  const loadUserProfile = useCallback(async () => {
    const res = await userService.getUser();

    if (!res) {
      console.error('Failed to load user profile');
      return navigate("/");
    }


    setUserId(res.researcherId);

    const researcherRes = await researcherService.getResearcherById(res.researcherId);
    if (!researcherRes) {
      console.error('Failed to load researcher profile');
      return;
    }

    setUserFormData({
      name: res.name || '',
      email: res.email || '',
      researchAreas: researcherRes.data.researchAreas || [],
      technicalSkills: researcherRes.data.technicalSkills || []
    });

    setInitialState({
      name: res.name || '',
      email: res.email || '',
      researchAreas: researcherRes.data.researchAreas || [],
      technicalSkills: researcherRes.data.technicalSkills || []
    });

    await loadTags();

  }, [loadTags, setUserId, setUserFormData]);

  useEffect(() => { loadUserProfile(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="page-container">
      <div id="edit" className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-qut-light-blue font-semibold tracking-wide uppercase">Profile Management</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight qut-text-primary sm:text-4xl">
              Update Your Research Profile
            </p>
            <p className="mt-4 max-w-2xl text-xl qut-text-tertiary lg:mx-auto">
              Keep your information current to help others find you for collaboration
            </p>
          </div>

          <div className="mt-10">
            <div className="qut-bg-secondary shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 qut-bg-tertiary">
                <h3 className="text-lg leading-6 font-medium qut-text-primary">
                  Researcher Information
                </h3>
                <p className="mt-1 max-w-2xl text-sm qut-text-tertiary">
                  Personal details and research focus
                </p>
              </div>
              <div className="border-t qut-border-primary px-4 py-5 sm:p-0">
                <form onSubmit={handleSubmit} className='qut-text-tertiary' >
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <label htmlFor="name" className="block text-sm font-medium sm:mt-px sm:pt-2">
                      Full Name
                    </label>
                    <div className="mt-1 sm:mt-0 sm:col-span-2">
                      <input type="text" name="name" id="name" onChange={handleInputChange} 
                      className="max-w-lg block w-full py-2 px-2 shadow-sm focus:ring-qut-blue focus:border-qut-blue sm:max-w-xs sm:text-sm rounded-md qut-bg-primary border qut-border-primary" value={userFormData.name} />
                    </div>
                  </div>


                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <label htmlFor="email" className="block text-sm font-medium sm:mt-px sm:pt-2">
                      Email
                    </label>
                    <div className="mt-1 sm:mt-0 sm:col-span-2">
                      <input type="email" name="email" id="email" onChange={handleInputChange} 
                      className="max-w-lg block w-full py-2 px-2 shadow-sm focus:ring-qut-blue focus:border-qut-blue sm:max-w-xs sm:text-sm rounded-md qut-bg-primary border qut-border-primary" value={userFormData.email} />
                    </div>
                  </div>

                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">

                    <label className="block text-sm font-medium sm:mt-px sm:pt-2">
                      Research Interests
                    </label>

                    <div className="mt-1 sm:mt-0 sm:col-span-2">

                      <div className="flex flex-wrap gap-2 mb-2" id="interest-tags">

                        {userFormData.researchAreas.map((area, index) => (

                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {area}
                            <button type="button" className="ml-1.5 inline-flex text-blue-400 hover:text-blue-600 focus:outline-none">
                              <span className="sr-only">Remove tag</span>
                              <i onClick={() => handleRemoveResearchArea(area)} className="fas fa-times"></i>
                            </button>
                          </span>

                        ))}

                      </div>


                      <div className="flex">

                        <select id="new-interest" value={researchArea} onChange={handleResearchAreaChange} className="max-w-lg block w-full shadow-sm focus:ring-qut-blue focus:border-qut-blue sm:max-w-xs sm:text-sm qut-bg-primary border qut-border-primary rounded-md">
                          <option value="">Select an interest</option>
                          {researchAreasList.map((area) => {
                            if (userFormData.researchAreas.includes(area)) return null;
                            return (
                              <option key={area} value={area}>
                                {area}
                              </option>
                            );
                          })}
                        </select>
                        <button type="button" id="add-interest" onClick={handleAddResearchArea} className="inline-flex items-center px-3 py-2 border border-l-0 qut-bg-primary border qut-border-primary rounded-r-md hover:qut-bg-primary focus:outline-none focus:ring-1 focus:ring-qut-blue focus:border-qut-blue">
                          Add
                        </button>
                      </div>

                    </div>
                  </div>


                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <label className="block text-sm font-medium sm:mt-px sm:pt-2">
                      Technical Skills
                    </label>
                    <div className="mt-1 sm:mt-0 sm:col-span-2">
                      <div className="flex flex-wrap gap-2 mb-2" id="interest-tags">

                        {userFormData.technicalSkills.map((skill, index) => (

                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {skill}
                            <button type="button" className="ml-1.5 inline-flex text-blue-400 hover:text-blue-600 focus:outline-none">
                              <span className="sr-only">Remove tag</span>
                              <i onClick={() => handleRemoveTechnicalSkill(skill)} className="fas fa-times"></i>
                            </button>
                          </span>

                        ))}

                      </div>
                      <div className="flex">
                        <Select
                          options={options}
                          onChange={(values) => handleAddSkill(values)}
                          placeholder="Select a skill"
                          className="max-w-lg block w-full shadow-sm focus:ring-qut-blue focus:border-qut-blue sm:max-w-xs sm:text-sm qut-bg-primary border qut-border-primary rounded-md"
                          style={{
                            "width": "320px",

                          }}
                        />
                        <button type="button" id="add-skill" className="inline-flex items-center px-3 py-2 border border-l-0 qut-bg-primary border qut-border-primary rounded-r-md hover:qut-bg-primary focus:outline-none focus:ring-1 focus:ring-qut-blue focus:border-qut-blue">
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-3 text-right sm:px-6">
                    {update && (
                      <>
                      <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-qut-blue hover:bg-qut-light-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qut-blue">
                        Save Changes
                      </button>
                      <button type="button" onClick={() => { setUserFormData(initialState); setUpdate(false); }} className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-400 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400">
                        Reset
                      </button>
                      </>
                    )}
                    {!update && (
                      <>
                      <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900" disabled>
                        Save Changes
                      </button>
                      <button type="button" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900" disabled>
                        Reset
                      </button>
                      </>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;