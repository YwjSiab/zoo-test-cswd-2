// formsubmission.js
// This module handles form submissions for the NTC Zoo application.
// It includes functions to sanitize user input, process the booking form,
// process the membership form, and attach the relevant event listeners.

/**
 * Function to initialize the membership form (without handling submission)
 */
export const initializeMembershipForm = () => {
    console.log("Initializing membership form...");
    const form = document.getElementById("membershipForm");
    if (!form) {
      console.error("Membership form not found.");
      return;
    }
    // Reset the form fields on page load or apply any default values.
    form.reset();
  };

//////////////////////////////
// Input Sanitization
//////////////////////////////
export const sanitizeInput = (input) => {
    console.log("Before Sanitization:", input);
    
    // Buffer Overflow Protection: Limit input length to 255 characters.
    const maxLength = 255;
    if (input.length > maxLength) {
      console.warn("Input truncated due to length limit");
      input = input.slice(0, maxLength);
    }
    
    // SQL Injection Detection using a regex pattern.
    const sqlPattern = /\b(SELECT|INSERT|DELETE|DROP|UPDATE|UNION|--|;|\|)/gi;
    if (sqlPattern.test(input)) {
      console.warn("SQL Injection pattern detected in input:", input);
      // Reject the input by throwing an error to prevent submission.
      throw new Error("Suspicious input detected. Please remove any SQL keywords.");
    }
    
    // Remove any HTML tags.
    const tagStripped = input.replace(/<[^>]*>?/gm, "");
    
    // Encode common dangerous characters.
    const encoded = tagStripped
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
    
    console.log("After Sanitization:", encoded);
    return encoded;
  };
  
  //////////////////////////////
  // Booking Form Submission
  //////////////////////////////
  export const setupBookingForm = () => {
    const bookingForm = document.getElementById("bookingForm");
    if (!bookingForm) {
      console.error("Booking form not found. Check your HTML.");
      return;
    }
    
    bookingForm.addEventListener("submit", (event) => {
      event.preventDefault(); // Prevent default form submission
      
      try {
        // Retrieve and sanitize input values.
        const visitorName = sanitizeInput(document.getElementById("visitorName").value.trim());
        const contact = sanitizeInput(document.getElementById("contact").value.trim());
        const selectedAnimal = sanitizeInput(document.getElementById("animal").value);
        const dateTime = sanitizeInput(document.getElementById("dateTime").value);
        const groupSize = parseInt(document.getElementById("groupSize").value, 10);
        
        // Validate inputs.
        if (!visitorName || !contact || !selectedAnimal || !dateTime || isNaN(groupSize) || groupSize < 1) {
          throw new Error("Please fill in all required fields with valid data.");
        }
        
        // Store booking data to localStorage.
        const bookings = JSON.parse(localStorage.getItem("bookings")) || [];
        bookings.push({ visitorName, contact, selectedAnimal, dateTime, groupSize });
        localStorage.setItem("bookings", JSON.stringify(bookings));
        
        alert("Booking confirmed!");
        
        // Update the visitor count, if a global updateVisitorCount() function exists.
        if (window.updateVisitorCount) {
          window.updateVisitorCount(groupSize);
        }
        
        // Reset the booking form.
        bookingForm.reset();
        
      } catch (error) {
        console.error("Error processing booking:", error.message);
        alert(error.message);
      }
    });
  };
  
  //////////////////////////////
  // Membership Form Submission
  //////////////////////////////
  export const handleMembershipSubmission = (event) => {
    event.preventDefault();
    try {
      // Get membership form fields.
      const nameEl = document.getElementById("name");
      const emailEl = document.getElementById("email");
      const membershipTypeEl = document.getElementById("membershipType");
      const startDateEl = document.getElementById("startDate");
      const emergencyContactEl = document.getElementById("emergencyContact");
      
      // Ensure all required fields exist.
      if (!nameEl || !emailEl || !membershipTypeEl || !startDateEl || !emergencyContactEl) {
        throw new Error("Some membership form fields were not found in the DOM.");
      }
      
      // Read and sanitize the input values.
      const name = sanitizeInput(nameEl.value.trim());
      const email = sanitizeInput(emailEl.value.trim());
      const membershipType = sanitizeInput(membershipTypeEl.value);
      const startDate = sanitizeInput(startDateEl.value);
      const emergencyContact = sanitizeInput(emergencyContactEl.value.trim());
      
      // Validate input values.
      if (!name || !email || !membershipType || !startDate || !emergencyContact) {
        throw new Error("Please fill in all required fields.");
      }
      
      // Save membership data to localStorage.
      const members = JSON.parse(localStorage.getItem("members")) || [];
      members.push({ name, email, membershipType, startDate, emergencyContact });
      localStorage.setItem("members", JSON.stringify(members));
      
      // Optionally use a global displaySuccess() function to show a success message.
      if (window.displaySuccess) {
        window.displaySuccess("Membership registration successful!");
      }
      
      console.log("Membership registered successfully.");
      
      // Update visitor count using a global function if available.
      if (window.updateVisitorCount) {
        window.updateVisitorCount(1);
      }
      
      // Reset the membership form.
      event.target.reset();
      
    } catch (error) {
      console.error("Error processing membership registration:", error.message);
      // Optionally use a global displayError() function if defined.
      if (window.displayError) {
        window.displayError(error.message);
      }
    }
  };
  
  export const setupMembershipForm = () => {
    const membershipForm = document.getElementById("membershipForm");
    if (!membershipForm) {
      console.error("Membership form not found.");
      return;
    }
    membershipForm.addEventListener("submit", handleMembershipSubmission);
  };  