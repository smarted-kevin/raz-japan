"use server";

import { fetchMutation, fetchQuery } from "convex/nextjs";
import type { NewCourseForm } from "./schemas";
import { api } from "convex/_generated/api";

export async function addCourse(formData: NewCourseForm) {
  return "Hello World";
}
