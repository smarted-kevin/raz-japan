"use server";

import { fetchMutation, fetchQuery } from "convex/nextjs";
import type { NewClassroomForm, NewStudentData } from "./schemas";
import { api } from "../../../../../convex/_generated/api";
import Words from "./wordList.json";

export async function addClassroom(formData: NewClassroomForm) {
    //check if classroom with entered name already exists
    const classroom = await fetchQuery(api.queries.classroom.getClassroomByName, { classroom_name: formData.classroom_name });
    //if classroom exists throw error
  
    if (classroom !== null) return "Something went wrong."
    //if classroom name is accepted create classroom
    const newClassroom = await fetchMutation(
      api.mutations.classroom.createClassroom, 
      { 
        classroom_name: formData.classroom_name,
        course_name: formData.course_name,
        organization: formData.organization_name
      }
    );

    //Return error if new classroom not created
    if (!newClassroom) return "Target Angry!"   ///FIX THIS
    
    // Check if newClassroom is an error string
    if (typeof newClassroom === "string") return newClassroom;
    
  const usedUsernames:string[] = [];
  const usedPasswords:string[] = [];
  
  const students:NewStudentData[] = [];
    
  const wordList = Words.words;
  for (let i=0; i < formData.student_count; i++) {
    const usernameArray: string[] = wordList.filter(e => !usedUsernames.includes(e));
    const username: string | undefined = usernameArray[Math.floor(Math.random()*usernameArray.length)];

    const passwordArray:string[] = wordList.filter(e => !usedPasswords.includes(e));
    const password:string | undefined = passwordArray[Math.floor(Math.random() * passwordArray.length)];
    
    //Append 3 digits to end of username and password
    const usernameSalt = (Math.floor((Math.random() * 1000)/2)) + 100;
    const passwordSalt = (Math.floor((Math.random() * 1000)/2)) + 100;
    
    //Create username and password 
    const saltedUser = username?.concat(usernameSalt.toString());
    const saltedPassword = password?.concat(passwordSalt.toString());

    //Add student object to array
    if (saltedUser && saltedPassword){
      usedUsernames.push(saltedUser);
      usedPasswords.push(saltedPassword);
    
      students.push({
        username: saltedUser,
        password: saltedPassword,
        classroom_id: newClassroom.classroom_id,
        course_id: newClassroom.course_id,
        status: "inactive",
      })
    }
  }
  const createdStudents = await fetchMutation(
    api.mutations.student.createStudents, { students: students}
  );
  
  return createdStudents;
}
