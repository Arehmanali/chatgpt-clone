# ChatGPT Clone with Message Branching

A simplified ChatGPT clone that implements comprehensive message branching functionality, allowing users to edit both their prompts and AI responses to create separate conversation branches.

## Features

- Basic chat functionality with AI responses
- User message editing with branching
- AI response editing with branching
- Visual navigation between different branches
- Real-time state management
- Persistent storage with Supabase

## Tech Stack

- Next.js
- TypeScript
- Supabase
- Zustand
- Tailwind CSS

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd chatgpt-clone
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a new project at [Supabase](https://supabase.com)
   - Copy the SQL from `supabase/schema.sql` and run it in the SQL editor
   - Copy your project URL and anon key
   - Create a `.env.local` file with your Supabase credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                # Next.js app directory
├── components/         # React components
├── lib/               # Utility libraries
├── store/             # State management
├── types/             # TypeScript types
└── utils/             # Helper functions
```

## Database Schema

### Users
- `id`: UUID (Primary Key)
- `email`: TEXT
- `created_at`: TIMESTAMP

### Conversations
- `id`: UUID (Primary Key)
- `title`: TEXT
- `user_id`: UUID (Foreign Key)
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### Branches
- `id`: UUID (Primary Key)
- `conversation_id`: UUID (Foreign Key)
- `parent_branch_id`: UUID (Foreign Key)
- `created_at`: TIMESTAMP

### Messages
- `id`: UUID (Primary Key)
- `content`: TEXT
- `role`: TEXT ('user' | 'assistant')
- `parent_id`: UUID (Foreign Key)
- `conversation_id`: UUID (Foreign Key)
- `branch_id`: UUID (Foreign Key)
- `created_at`: TIMESTAMP

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 