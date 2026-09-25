import{j as e}from"./index-DfF5-I9K.js";import{T as l,I as m}from"./TextInput-BdGuKGKJ.js";import{I as d}from"./InputLabel-DswecwR6.js";import{P as x}from"./PrimaryButton-B33UjtX_.js";import{G as g}from"./GuestLayout-CezTxsVl.js";import{u as h,H as p,L as b}from"./inertia-XJ44Jcz2.js";function j({className:s="",...o}){return e.jsx("input",{...o,type:"checkbox",className:"rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500 "+s})}function L({status:s,canResetPassword:o}){const{data:t,setData:r,post:c,processing:i,errors:n,reset:u}=h({email:"",password:"",remember:!1}),f=a=>{a.preventDefault(),c(route("login"),{onSuccess:()=>{window.location.href=route("dashboard")},onFinish:()=>u("password")})};return e.jsxs(g,{children:[e.jsx(p,{title:"Log in"}),e.jsxs("div",{className:"mb-8 text-center welcome-animation",children:[e.jsx("img",{src:"/images/logo.png",alt:"Zartab Fatima Collection Logo",className:"mb-3 inline-block h-16 w-16 rounded-full object-cover border-2 border-indigo-500 shadow-lg transition-all duration-500 hover:scale-110"}),e.jsx("h1",{className:"text-3xl font-extrabold tracking-tight text-gray-800 transition-all duration-500 hover:text-indigo-600",children:"Welcome to Zartab"}),e.jsx("h2",{className:"mt-1 text-xl font-semibold text-indigo-600",children:"Inventory System"}),e.jsx("p",{className:"mt-2 text-sm text-gray-500",children:"Please log in to access your inventory dashboard"})]}),s&&e.jsx("div",{className:"mb-4 rounded-lg bg-green-50 p-3 text-sm font-medium text-green-600 shadow-sm status-animation",children:s}),e.jsxs("form",{onSubmit:f,className:"login-form-animation",children:[e.jsxs("div",{className:"form-field",children:[e.jsx(d,{htmlFor:"email",value:"Email"}),e.jsx(l,{id:"email",type:"email",name:"email",value:t.email,className:"mt-1 block w-full transition-all duration-300 hover:border-indigo-400 hover:shadow-sm focus:scale-[1.01] focus:border-indigo-500 focus:ring-indigo-500",autoComplete:"username",isFocused:!0,onChange:a=>r("email",a.target.value)}),e.jsx(m,{message:n.email,className:"mt-2"})]}),e.jsxs("div",{className:"mt-4 form-field-delay",children:[e.jsx(d,{htmlFor:"password",value:"Password"}),e.jsx(l,{id:"password",type:"password",name:"password",value:t.password,className:"mt-1 block w-full transition-all duration-300 hover:border-indigo-400 hover:shadow-sm focus:scale-[1.01] focus:border-indigo-500 focus:ring-indigo-500",autoComplete:"current-password",onChange:a=>r("password",a.target.value)}),e.jsx(m,{message:n.password,className:"mt-2"})]}),e.jsx("div",{className:"mt-4 block remember-animation",children:e.jsxs("label",{className:"flex cursor-pointer items-center transition-all duration-300 hover:translate-x-1",children:[e.jsx(j,{name:"remember",checked:t.remember,onChange:a=>r("remember",a.target.checked)}),e.jsx("span",{className:"ms-2 text-sm text-gray-600 transition-colors duration-300 hover:text-indigo-600",children:"Remember me"})]})}),e.jsxs("div",{className:"mt-6 flex items-center justify-end action-animation",children:[o&&e.jsx(b,{href:route("password.request"),className:"rounded-md text-sm text-gray-600 underline transition-all duration-300 hover:translate-x-1 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",children:"Forgot your password?"}),e.jsx(x,{className:"ms-4 transform transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95",disabled:i,children:e.jsxs("span",{className:"flex items-center gap-2",children:[i&&e.jsx("span",{className:"h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"}),i?"Logging in...":"Log in"]})})]})]}),e.jsx("style",{children:`
                @keyframes welcome {
                    0% {
                        opacity: 0;
                        transform: translateY(-30px) scale(0.95);
                    }

                    100% {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                @keyframes loginForm {
                    0% {
                        opacity: 0;
                        transform: translateY(30px);
                    }

                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes status {
                    0% {
                        opacity: 0;
                        transform: scale(0.95);
                    }

                    100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @keyframes field {
                    0% {
                        opacity: 0;
                        transform: translateX(-20px);
                    }

                    100% {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                .welcome-animation {
                    animation: welcome 0.8s ease-out;
                }

                .login-form-animation {
                    animation: loginForm 0.9s ease-out;
                }

                .status-animation {
                    animation: status 0.5s ease-out;
                }

                .form-field {
                    animation: field 0.6s ease-out;
                }

                .form-field-delay {
                    animation: field 0.7s ease-out;
                }

                .remember-animation {
                    animation: field 0.8s ease-out;
                }

                .action-animation {
                    animation: field 0.9s ease-out;
                }
            `})]})}export{L as default};
