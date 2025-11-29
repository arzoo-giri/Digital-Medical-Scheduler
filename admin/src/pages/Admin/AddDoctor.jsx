import React, { useState, useContext } from "react";
import { assets } from "../../assets/assets";
import { AdminContext } from "../../context/AdminContext";
import { toast } from "react-toastify";
import axios from "axios";

const AddDoctor = () => {
  const [docImg, setDocImg] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [experience, setExperience] = useState("1 Year");
  const [fees, setFees] = useState("");
  const [about, setAbout] = useState("");
  const [speciality, setSpeciality] = useState("General physician");
  const [degree, setDegree] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");

  const [errors, setErrors] = useState({});

  const { backendUrl, aToken } = useContext(AdminContext);

  const validate = () => {
    let temp = {};

    if (!docImg) temp.docImg = "Doctor image is required";

    if (!name.trim()) temp.name = "Name is required";
    else if (!/^[A-Za-z\s]+$/.test(name))
      temp.name = "Name can contain only letters";
    else if (name.trim().length < 3)
      temp.name = "Name must be at least 3 characters";

    
    if (!email.trim()) temp.email = "Email is required";
    else if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email))
      temp.email = "Invalid email format";

    if (!password) temp.password = "Password is required";
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password))
      temp.password =
        "Password must be 8+ chars, include uppercase, lowercase, number & symbol";

    if (!fees) temp.fees = "Fees required";
    else if (isNaN(fees) || fees <= 0)
      temp.fees = "Fees must be a positive number";

    if (!degree.trim()) temp.degree = "Degree required";
    else if (!/^[A-Za-z0-9\s.-]+$/.test(degree))
      temp.degree = "Degree contains invalid characters";

    if (!about.trim()) temp.about = "About section required";
    else if (about.trim().length < 20)
      temp.about = "Write minimum 20 characters about the doctor";

    if (!address1.trim()) temp.address1 = "Address line 1 required";
    if (!address2.trim()) temp.address2 = "Address line 2 required";

    setErrors(temp);

    const firstError = Object.values(temp)[0];
    if (firstError) toast.error(firstError);

    return Object.keys(temp).length === 0;
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (!validate()) {
      toast.error("Please fix the highlighted errors");
      return;
    }

    try {
      if (!docImg) {
        return toast.error("Image Not Selected");
      }

      const formData = new FormData();

      formData.append("image", docImg);
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("experience", experience);
      formData.append("fees", fees);
      formData.append("about", about);
      formData.append("speciality", speciality);
      formData.append("degree", degree);
      formData.append(
        "address",
        JSON.stringify({ line1: address1, line2: address2 })
      );

      const { data } = await axios.post(
        backendUrl + "/api/admin/add-doctor",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            atoken: aToken,
          },
        }
      );

      if (data.success) {
        toast.success(data.message);

        setDocImg(false);
        setName("");
        setEmail("");
        setPassword("");
        setAddress1("");
        setAddress2("");
        setDegree("");
        setAbout("");
        setFees("");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
      console.log(error);
    }
  };

  return (
    <form onSubmit={onSubmitHandler} className="m-5 w-full">
      <p className="mb-3 text-lg font-medium">Add Doctor</p>

      <div className="bg-white px-8 py-8 rounded w-full max-w-4xl max-h-[80vh] overflow-y-scroll">
        <div className="flex items-center gap-4 mb-8 text-gray-500">
          <label htmlFor="doc-img">
            <img
              className="w-16 bg-gray-100 rounded-full cursor-pointer"
              src={docImg ? URL.createObjectURL(docImg) : assets.upload_area}
              alt=""
            />
          </label>
          <input
            onChange={(e) => setDocImg(e.target.files[0])}
            type="file"
            id="doc-img"
            hidden
          />
          <p>
            Upload doctor <br /> picture
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-start gap-10 text-gray-600">
          <div className="w-full lg:flex-1 flex flex-col gap-4">
            {/* Name */}
            <div>
              <p>Doctor name</p>
              <input
                onChange={(e) => setName(e.target.value)}
                value={name}
                className="rounded px-3 py2 bg-[#F2F3FF]"
                type="text"
                placeholder="Name"
              />
              {errors.name && (
                <p className="text-red-500 text-xs">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <p>Doctor Email</p>
              <input
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                className="bg-[#F2F3FF] rounded px-3 py2"
                type="email"
                placeholder="Email"
              />
              {errors.email && (
                <p className="text-red-500 text-xs">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <p>Doctor password</p>
              <input
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                className="bg-[#F2F3FF] rounded px-3 py2"
                type="password"
                placeholder="Password"
              />
              {errors.password && (
                <p className="text-red-500 text-xs">{errors.password}</p>
              )}
            </div>

            {/* Experience */}
            <div>
              <p>Experience</p>
              <select
                onChange={(e) => setExperience(e.target.value)}
                value={experience}
                className="bg-[#F2F3FF] rounded px-3 py2"
              >
                {Array.from({ length: 10 }, (_, i) => (
                  <option key={i} value={`${i + 1} Year`}>
                    {i + 1} Year
                  </option>
                ))}
              </select>
            </div>

            {/* Fees */}
            <div>
              <p>Fees</p>
              <input
                onChange={(e) => setFees(e.target.value)}
                value={fees}
                className="bg-[#F2F3FF] rounded px-3 py2"
                type="number"
                placeholder="fees"
              />
              {errors.fees && (
                <p className="text-red-500 text-xs">{errors.fees}</p>
              )}
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="w-full lg:flex-1 flex flex-col gap-4">
            <div>
              <p>Speciality</p>
              <select
                onChange={(e) => setSpeciality(e.target.value)}
                value={speciality}
                className="bg-[#F2F3FF] rounded px-3 py2"
              >
                <option value="General physician">General physician</option>
                <option value="Gynecologist">Gynecologist</option>
                <option value="Dermatologist">Dermatologist</option>
                <option value="Pediatricians">Pediatricians</option>
                <option value="Neurologist">Neurologist</option>
                <option value="Gastroenterologist">Gastroenterologist</option>
              </select>
            </div>

            <div>
              <p>Education</p>
              <input
                onChange={(e) => setDegree(e.target.value)}
                value={degree}
                className="bg-[#F2F3FF] rounded px-3 py2"
                type="text"
                placeholder="Education (MBBS / MD)"
              />
              {errors.degree && (
                <p className="text-red-500 text-xs">{errors.degree}</p>
              )}
            </div>

            <div>
              <p>Address</p>
              <input
                onChange={(e) => setAddress1(e.target.value)}
                value={address1}
                className="bg-[#F2F3FF] rounded px-3 py2"
                type="text"
                placeholder="address 1"
              />
              {errors.address1 && (
                <p className="text-red-500 text-xs">{errors.address1}</p>
              )}

              <input
                onChange={(e) => setAddress2(e.target.value)}
                value={address2}
                className="bg-[#F2F3FF] rounded px-3 py2 mt-2"
                type="text"
                placeholder="address 2"
              />
              {errors.address2 && (
                <p className="text-red-500 text-xs">{errors.address2}</p>
              )}
            </div>
          </div>
        </div>

        <div>
          <p className="mt-4 mb-2">About Doctor</p>
          <textarea
            onChange={(e) => setAbout(e.target.value)}
            value={about}
            className="bg-[#F2F3FF] w-full px-4 pt-2 rounded"
            placeholder="write about doctor"
            rows={5}
          />
          {errors.about && (
            <p className="text-red-500 text-xs">{errors.about}</p>
          )}
        </div>

        <button
          type="submit"
          className="bg-primary px-10 py-3 mt-4 text-white rounded-full cursor-pointer"
        >
          Add doctor
        </button>
      </div>
    </form>
  );
};

export default AddDoctor;
