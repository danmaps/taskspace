-- Create default boards for all existing users who don't have any boards
DO $$
DECLARE
    user_record RECORD;
    work_board_id UUID;
    personal_board_id UUID;
    home_board_id UUID;
BEGIN
    FOR user_record IN 
        SELECT u.id 
        FROM auth.users u 
        LEFT JOIN public.boards b ON u.id = b.user_id 
        WHERE b.user_id IS NULL
    LOOP
        -- Insert Work board
        work_board_id := gen_random_uuid();
        INSERT INTO public.boards (id, name, user_id, created_at, updated_at)
        VALUES (
            work_board_id,
            'Work',
            user_record.id,
            NOW(),
            NOW()
        );
        
        -- Insert Personal board
        personal_board_id := gen_random_uuid();
        INSERT INTO public.boards (id, name, user_id, created_at, updated_at)
        VALUES (
            personal_board_id,
            'Personal',
            user_record.id,
            NOW(),
            NOW()
        );
        
        -- Insert Home board
        home_board_id := gen_random_uuid();
        INSERT INTO public.boards (id, name, user_id, created_at, updated_at)
        VALUES (
            home_board_id,
            'Home',
            user_record.id,
            NOW(),
            NOW()
        );

        -- Create default columns for Work board
        INSERT INTO public.columns (board_id, title, position, created_at, updated_at) VALUES
        (work_board_id, 'Do First (Urgent & Important)', 0, NOW(), NOW()),
        (work_board_id, 'Schedule (Important, Not Urgent)', 1, NOW(), NOW()),
        (work_board_id, 'Delegate (Urgent, Not Important)', 2, NOW(), NOW()),
        (work_board_id, 'Eliminate (Neither Urgent nor Important)', 3, NOW(), NOW());

        -- Create default columns for Personal board
        INSERT INTO public.columns (board_id, title, position, created_at, updated_at) VALUES
        (personal_board_id, 'Do First (Urgent & Important)', 0, NOW(), NOW()),
        (personal_board_id, 'Schedule (Important, Not Urgent)', 1, NOW(), NOW()),
        (personal_board_id, 'Delegate (Urgent, Not Important)', 2, NOW(), NOW()),
        (personal_board_id, 'Eliminate (Neither Urgent nor Important)', 3, NOW(), NOW());

        -- Create default columns for Home board
        INSERT INTO public.columns (board_id, title, position, created_at, updated_at) VALUES
        (home_board_id, 'Do First (Urgent & Important)', 0, NOW(), NOW()),
        (home_board_id, 'Schedule (Important, Not Urgent)', 1, NOW(), NOW()),
        (home_board_id, 'Delegate (Urgent, Not Important)', 2, NOW(), NOW()),
        (home_board_id, 'Eliminate (Neither Urgent nor Important)', 3, NOW(), NOW());
        
    END LOOP;
END $$;

-- Update the handle_new_user function to create default boards
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    work_board_id UUID;
    personal_board_id UUID;
    home_board_id UUID;
BEGIN
    -- Insert user profile
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', '')
    );

    -- Create default boards
    work_board_id := gen_random_uuid();
    personal_board_id := gen_random_uuid();
    home_board_id := gen_random_uuid();

    -- Insert Work board
    INSERT INTO public.boards (id, name, user_id, created_at, updated_at)
    VALUES (
        work_board_id,
        'Work',
        new.id,
        NOW(),
        NOW()
    );
    
    -- Insert Personal board
    INSERT INTO public.boards (id, name, user_id, created_at, updated_at)
    VALUES (
        personal_board_id,
        'Personal',
        new.id,
        NOW(),
        NOW()
    );
    
    -- Insert Home board
    INSERT INTO public.boards (id, name, user_id, created_at, updated_at)
    VALUES (
        home_board_id,
        'Home',
        new.id,
        NOW(),
        NOW()
    );

    -- Create default columns for Work board
    INSERT INTO public.columns (board_id, title, position, created_at, updated_at) VALUES
    (work_board_id, 'Do First (Urgent & Important)', 0, NOW(), NOW()),
    (work_board_id, 'Schedule (Important, Not Urgent)', 1, NOW(), NOW()),
    (work_board_id, 'Delegate (Urgent, Not Important)', 2, NOW(), NOW()),
    (work_board_id, 'Eliminate (Neither Urgent nor Important)', 3, NOW(), NOW());

    -- Create default columns for Personal board
    INSERT INTO public.columns (board_id, title, position, created_at, updated_at) VALUES
    (personal_board_id, 'Do First (Urgent & Important)', 0, NOW(), NOW()),
    (personal_board_id, 'Schedule (Important, Not Urgent)', 1, NOW(), NOW()),
    (personal_board_id, 'Delegate (Urgent, Not Important)', 2, NOW(), NOW()),
    (personal_board_id, 'Eliminate (Neither Urgent nor Important)', 3, NOW(), NOW());

    -- Create default columns for Home board
    INSERT INTO public.columns (board_id, title, position, created_at, updated_at) VALUES
    (home_board_id, 'Do First (Urgent & Important)', 0, NOW(), NOW()),
    (home_board_id, 'Schedule (Important, Not Urgent)', 1, NOW(), NOW()),
    (home_board_id, 'Delegate (Urgent, Not Important)', 2, NOW(), NOW()),
    (home_board_id, 'Eliminate (Neither Urgent nor Important)', 3, NOW(), NOW());

    RETURN new;
END;
$$;
