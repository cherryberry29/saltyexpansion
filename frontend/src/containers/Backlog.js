import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import './css/sprint.css';
import AssigneeSelector from './AssigneeSelector';
import DisplayIssueFilters from './DisplayIssueFilters';
import Modal from './modal';
import { FaPlus } from "react-icons/fa6";
import IssueType from './issuseType';
import { connect } from 'react-redux';
import { FaUser } from 'react-icons/fa';
import axios from 'axios';
import { addIssue } from '../actions/auth';
import IssueStatus from './issueStatus';
import { useDrag } from 'react-dnd';
import { SiStorybook } from "react-icons/si";
import { FaBug } from 'react-icons/fa';
import { FaTasks } from "react-icons/fa";
import BoardsIssueDisplay from './BoardsIssueDisplay';
import { FaRegTrashAlt } from "react-icons/fa";
import { FaPencilAlt } from 'react-icons/fa';
import { useSelector } from 'react-redux';


const Backlog = ({ addIssue, issuesList = [], sprint_name, onissueTypeChange }) => {
  const [showInputField, setShowInputField] = useState(false);
  const [selectedIssueType, setSelectedIssueType] = useState('Story');
  const { projectid } = useParams();
  const inputContainerRef = useRef(null);
  const scrollRef = useRef(null); // New ref for scrolling
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = () => {
    setIsDragging(true);
    document.addEventListener('mousemove', handleMouseMove);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
  };

  const handleMouseMove = (event) => {
    if (isDragging) {
      const scrollSpeed = 10;
      const threshold = 100;
      const { clientY } = event;
      let scrollAmount = 0;

      if (clientY < threshold) {
        scrollAmount = -scrollSpeed; // Scroll up
      } else if (clientY > window.innerHeight - threshold) {
        scrollAmount = scrollSpeed; // Scroll down
      }

      if (scrollAmount !== 0) {
        window.scrollBy(0, scrollAmount);
      }
    }
  };

  const handleClickOutside = (event) => {
    if (inputContainerRef.current && !inputContainerRef.current.contains(event.target) && event.target.className !== "EnterIssue") {
      setShowInputField(false);
    }
  };

  useEffect(() => {
    if (showInputField && scrollRef.current) {
      const scrollElement = scrollRef.current;
      const offset = 100; // Change this value to increase/decrease the scroll offset
      window.scrollTo({
        top: scrollElement.getBoundingClientRect().top + window.scrollY - offset,
        behavior: 'smooth',
      });
    }
  }, [showInputField]);

  useEffect(() => {
    if (showInputField) {
      document.addEventListener('click', handleClickOutside);
    } else {
      document.removeEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showInputField]);

  const handleCreateIssueClick = () => {
    setShowInputField(true); // Open the input field when "Create Issue" button is clicked
  };

  const handleKeyPress = async (event) => {
    if (event.key === 'Enter') {
      const newIssueName = event.target.value.trim();
      const isDuplicate = issuesList.some(issue => issue.IssueName === newIssueName);
      if (isDuplicate) {
        alert('An issue with this name already exists in the project.');
        return;
      }
      const newIssue = {
        IssueName: newIssueName,
        IssueType: selectedIssueType,
        projectId: projectid,
        sprint: sprint_name,
        assigned_epic: null,
      };
      try {
        await addIssue(newIssue);
        onissueTypeChange(true);
      } catch (error) {
        console.error('Error creating issue:', error);
        const errorMessage = error.payload ? error.payload.error : 'An unexpected error occurred. Please try again later.';
        alert(errorMessage);
      }
      setShowInputField(false); // Close the input field after creating the issue
      event.target.value = '';
    }
  };

  const handleInputClick = (event) => {
    event.stopPropagation(); // Prevent event propagation when input field is clicked
  };

  return (
    <>
      <div className={issuesList.length ? 'solid-box' : 'dotted-box'}>
        {issuesList.length === 0 ? (
          <div className="empty-message">Create issues to add to our sprint and then start sprint</div>
        ) : (
          issuesList.map((value, index) => {
            return <DraggableIssue key={index} issue={value} projectid={projectid} onissueTypeChange={onissueTypeChange} onDragStart={handleDragStart} onDragEnd={handleDragEnd} />;
          })
        )}
      </div>
      <div className="create-issue" ref={inputContainerRef}>
        {!showInputField && (
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCreateIssueClick(); }} className='create-btn-Backlogs'>
            <span><FaPlus /></span>
            <span>Create Issue</span>
          </button>
        )}
        {showInputField && (
          <div className="issueCreation" ref={scrollRef} onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            <IssueType onSelect={setSelectedIssueType} />
            <input
              type="text"
              className="EnterIssue"
              placeholder="Type your issue here"
              onKeyDown={handleKeyPress}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            />
          </div>
        )}
      </div>
    </>
  );
};










const DraggableIssue = ({ issue, projectid, onissueTypeChange,onDragStart, onDragEnd }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'ISSUE',
    item: { issue },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));
  const user=useSelector(state => state.auth.user);
  // const [{ isDragging }, drag] = useDrag({
  //   type: 'ISSUE',
  //   item: {  issue }, // Specify the item being dragged
  //   collect: (monitor) => ({
  //     isDragging: !!monitor.isDragging(),
  //   }),
  //   // Specify onDragStart and onDragEnd functions
  //   begin: () => {
  //     onDragStart();
  //   },
  //   end: () => {
  //     onDragEnd();
  //   },
  // });
  
 
  
  
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownEpics, setDropdownEpics] = useState(false);
  const [Epics, setEpics] = useState([]);
  const [selectedEpic, setSelectedEpic] = useState(issue.assigned_epic ? issue.assigned_epic.EpicName : null);
  const [editedIssueName, setEditedIssueName] = useState(issue.IssueName);
  const [assigneeOptions, setAssigneeOptions] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  // useEffect(() => {
  //   const handleScroll = (event) => {
  //     if (isDragging) {
  //       const { clientY } = event;
  //       const threshold = 150; // Distance from edge to start scrolling
  //       const scrollSpeed = 20; // Scrolling speed
  //       let scrollAmount = 0;
  
  //       if (clientY < threshold) {
  //         scrollAmount = -scrollSpeed; // Scroll up
  //       } else if (clientY > window.innerHeight - threshold) {
  //         scrollAmount = scrollSpeed; // Scroll down
  //       }
  
  //       if (scrollAmount !== 0) {
  //         const scroll = () => {
  //           window.scrollBy(0, scrollAmount);
  //           if (isDragging) {
  //             requestAnimationFrame(scroll);
  //           }
  //         };
  //         requestAnimationFrame(scroll);
  //       }
  //     }
  //   };
  
  //   document.addEventListener('mousemove', handleScroll);
  
  //   return () => {
  //     document.removeEventListener('mousemove', handleScroll);
  //   };
  // }, [isDragging]);
  
  
  
  
  
  
  
  const [showPopup, setShowPopup] = useState(false);
  const togglePopup = () => {
    setShowPopup(!showPopup);
  };



  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const teamMembersResponse = await axios.get(`http://localhost:8000/djapp/get_assignee/?projectid=${projectid}`);
        console.log("teammmmmmmmmmmmm", teamMembersResponse.data.team_members)
        setAssigneeOptions(teamMembersResponse.data.team_members);
      } catch (error) {
        console.error('Error fetching team members and sprints:', error);
      }
    };
    fetchTeamMembers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownVisible && !event.target.closest('.assignee-container')) {
        setDropdownVisible(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [dropdownVisible]);
  // useEffect(() => {
  //   const fetchcolor = async () => {
  //     if (selectedAssignee) {
  //       try {
  //         const response = await axios.post('http://localhost:8000/djapp/fetch_assignee_color/', { assignee: selectedAssignee });
  //         console.log("insideassigneeee", response.data.user.color)
  //         console.log(response.data.user.first_letter)
  //         setAssigneeColor(response.data.user.color);
  //         setAssigneeInitial(response.data.user.first_letter);
  //       } catch (error) {
  //         console.error('Error fetching team members and sprints:', error);
  //       }
  //     };
  //   }
  //   fetchcolor();
  // }, []);

  // useEffect(() => {
  //   const fetchEpics = async () => {
  //     try {
  //       const epicsResponse = await axios.get(`http://localhost:8000/djapp/fecth_epics/?projectid=${projectid}`);
  //       setEpics(epicsResponse.data.epic_in_project);
  //     } catch (error) {
  //       console.error('Error fetching team members and sprints:', error);
  //     }
  //   };
  //   fetchEpics();
  // }, []);

  // const toggleDropdown = () => {
  //   setDropdownEpics(!dropdownEpics);
  // };

  const getIssueIcon = (issueType) => {
    switch (issueType) {
      case 'Bug':
        return <FaBug />;
      case 'Task':
        return <FaTasks />;
      default:
        return <SiStorybook />;
    }
  };

  // const handleSelectEpic = async (epic) => {
  //   setSelectedEpic(epic);
  //   setDropdownEpics(!dropdownEpics);
  //   try {
  //     const response = await axios.post('http://localhost:8000/djapp/update_issueepic/', { issue: issue.IssueName, epic: epic, projectId: projectid });
  //   } catch (error) {
  //     console.error('Error updating issue epic:', error);
  //   }
  // };

  const handleDeleteIssue = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this issue?");
    if (confirmDelete) {
      try {
        const response = await axios.get("http://localhost:8000/djapp/delete_issue/", {
          params: { projectId: projectid, issueName: issue.IssueName }
        });
        alert("Issue deleted successfully");
        onissueTypeChange(true);
      } catch (error) {
        console.error("Error deleting issue:", error);
        alert("Failed to delete issue");
      }
    }
  };

  const handleInputBlur = () => {
    setIsEditing(false);
  };

  const handleInputChange = (event) => {
    setEditedIssueName(event.target.value);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };
  const handleAssigneeChange = (newAssignee) => {
    console.log(`Assignee changed to: ${newAssignee}`);
    // Add your logic here to handle the assignee change, if needed
  };


  const handleInputKeyDown = async (event) => {
    if (event.key === 'Enter') {
      handleInputBlur();
      try {
        const response = await axios.post("http://localhost:8000/djapp/update_issue_name/", {
          projectId: projectid,
          oldIssueName: issue.IssueName,
          newIssueName: editedIssueName,
        });
        onissueTypeChange(true);
      } catch (error) {
        console.error("Error updating issue name:", error);
        alert("Failed to update issue name");
      }
    }
  };

  return (
    <div className="scroll-container">
    <div className="input-item" ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }} onClick={togglePopup} >
      <div className='left-part' >
      {isEditing ? (
        <>
          <input
            type="text"
            value={editedIssueName}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            autoFocus
          />
          <div className="close">X</div>
        </>
      ) : (
        <div className="issueType">
          {getIssueIcon(issue.IssueType || 'Story')}
          <div className={issue.status === 'Done' ? 'issue-done' : 'value'}>
            {issue.IssueName}
            <FaPencilAlt onClick={  (e) => { e.preventDefault(); e.stopPropagation(); handleEditClick(); } }className="edit-icon" />
          </div>
        </div>
      )}
      <div className="addEpic">
        {selectedEpic ? (
          <span className="selected-epic">{selectedEpic}</span>
        ) : (
          <>


          </>
        )}
        {/* {dropdownEpics && Epics.length > 0 && (
          <div className="dropdown-menu">
            {Epics.map((epic, index) => (
              <div key={index} className="dropdown-item" onClick={() => handleSelectEpic(epic.EpicName)}>
                {epic.EpicName}
              </div>
            ))}
          </div>
        )} */}
      </div>
      </div>
      <div className="right-most"  onClick={(e) => e.stopPropagation()}>
        <div className="right">
          <IssueStatus issueName={issue} pid={projectid} onissueTypeChange={onissueTypeChange} />
        </div>
        <div className="right1">
          <div className="assignee-container">
          <AssigneeSelector issue={issue} projectid={projectid} onAssigneeChange={(newAssignee) => handleAssigneeChange(newAssignee)} />
           </div>
        </div>
        <div id="deleteIssue" className="Dropdown" onClick={handleDeleteIssue}>
          <FaRegTrashAlt />
        </div>
      </div>
      {showPopup && (
        <Modal onClose={togglePopup}>
        <DisplayIssueFilters data={issue} user={user}/>
      </Modal>
            

         
        
      )}
    </div>
</div>
  );
};


export default connect(null, { addIssue })(Backlog);

