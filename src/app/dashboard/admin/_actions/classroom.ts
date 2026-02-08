"use server";

import { fetchMutation, fetchQuery } from "convex/nextjs";
import type { NewClassroomForm, NewStudentData } from "./schemas";
import { api } from "../../../../../convex/_generated/api";
import Words from "./wordList.json";
import type { Id } from "@/convex/_generated/dataModel";

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
    if (username && password && saltedUser && saltedPassword){
      // Push raw words (not salted) to prevent reuse of the same base word
      usedUsernames.push(username);
      usedPasswords.push(password);
    
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

export async function addStudentsToClassroom(
  classroomId: Id<"classroom">,
  courseId: string,
  studentCount: number
) {
  // Get existing students in the classroom to check count
  const existingStudents = await fetchQuery(
    api.queries.student.getStudentsByClassroomId,
    { classroom_id: classroomId }
  );

  const currentCount = existingStudents.length;
  const maxStudents = 36;

  // Check if adding these students would exceed the limit
  if (currentCount + studentCount > maxStudents) {
    return `Cannot add ${studentCount} students. Current count: ${currentCount}, Maximum: ${maxStudents}. You can add at most ${maxStudents - currentCount} students.`;
  }

  const usedUsernames: string[] = [];
  const usedPasswords: string[] = [];

  const wordList = Words.words;

  // Helper function to extract base word from salted username/password
  const extractBaseWord = (salted: string): string | undefined => {
    return wordList.find((word) => salted.startsWith(word));
  };

  // Get all existing usernames and passwords to avoid duplicates
  // Extract the base word (without salt) for proper comparison
  existingStudents.forEach((student) => {
    const baseUsername = extractBaseWord(student.username);
    const basePassword = extractBaseWord(student.password);
    if (baseUsername) usedUsernames.push(baseUsername);
    if (basePassword) usedPasswords.push(basePassword);
  });

  const students: NewStudentData[] = [];

  for (let i = 0; i < studentCount; i++) {
    const usernameArray: string[] = wordList.filter(
      (e) => !usedUsernames.includes(e)
    );
    const username: string | undefined =
      usernameArray[Math.floor(Math.random() * usernameArray.length)];

    const passwordArray: string[] = wordList.filter(
      (e) => !usedPasswords.includes(e)
    );
    const password: string | undefined =
      passwordArray[Math.floor(Math.random() * passwordArray.length)];

    // Append 3 digits to end of username and password
    const usernameSalt = Math.floor(Math.random() * 1000 / 2) + 100;
    const passwordSalt = Math.floor(Math.random() * 1000 / 2) + 100;

    // Create username and password
    const saltedUser = username?.concat(usernameSalt.toString());
    const saltedPassword = password?.concat(passwordSalt.toString());

    // Add student object to array
    if (username && password && saltedUser && saltedPassword) {
      // Push raw words (not salted) to prevent reuse of the same base word
      usedUsernames.push(username);
      usedPasswords.push(password);

      students.push({
        username: saltedUser,
        password: saltedPassword,
        classroom_id: classroomId,
        course_id: courseId as Id<"course">,
        status: "inactive",
      });
    }
  }

  const createdStudents = await fetchMutation(
    api.mutations.student.createStudents,
    { students: students }
  );

  return createdStudents;
}