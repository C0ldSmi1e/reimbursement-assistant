const InfoBar = ({
  name,
  email,
  onLogout,
}: {
  name: string | undefined;
  email: string | undefined;
  onLogout: () => void;
}) => {
  return (
    <div className="w-full flex justify-between items-center gap-4 border-2 border-black rounded-md p-4">
      <div className="md:block hidden font-bold">Reimbursement Assistant</div>
      <div className="flex items-center gap-2">
        <span>👋🏻 Hi, </span>
        <span className="hidden md:block">{name} | </span>
        <span>{email}</span>
      </div>
      <button onClick={onLogout}>Logout</button>
    </div>
  );
};

export default InfoBar;