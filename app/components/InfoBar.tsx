import { Form } from "@remix-run/react";

const InfoBar = ({
  name,
  email,
}: {
  name: string | undefined;
  email: string | undefined;
}) => {
  return (
    <div className="w-full flex justify-between items-center gap-4 border-2 border-black rounded-md p-4">
      <div className="md:block hidden font-bold">Reimbursement Assistant</div>
      <div className="flex items-center gap-2">
        <span>👋🏻 Hi, </span>
        <span className="hidden md:block">{name} | </span>
        <span>{email}</span>
      </div>
      <Form method="post" action="/logout">
        <button type="submit">Logout</button>
      </Form>
    </div>
  );
};

export default InfoBar;