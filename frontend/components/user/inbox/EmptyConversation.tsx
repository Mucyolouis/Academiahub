import React from "react";
import NewMessageModal from "./NewMessageModal";

const EmptyConversation = () => {
  return (
    <div className="flex h-full min-h-[80vh] bg-white rounded-2xl mt-2 lg:mt-6 lg:mx-6 justify-center items-center py-20 flex-col text-center">
      <h4 className="font-semibold text-lg leading-5 ">No messages yet</h4>
      <p className="text-sm leading-4.5 text-gray-400">
        Start a conversation with an author to learn about their works
      </p>
      <div className="mt-6">
        <NewMessageModal className="px-4 py-2 rounded-lg border border-primary hover:bg-primary hover:text-white transition-colors" />
      </div>
    </div>
  );
};

export default EmptyConversation;
