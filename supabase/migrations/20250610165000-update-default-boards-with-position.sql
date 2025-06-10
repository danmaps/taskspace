-- Update the handle_new_user function to include position when creating default boards
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

    -- Create default boards with positions
    work_board_id := gen_random_uuid();
    personal_board_id := gen_random_uuid();
    home_board_id := gen_random_uuid();

    -- Insert Work board (position 0)
    INSERT INTO public.boards (id, name, user_id, position, created_at, updated_at)
    VALUES (
        work_board_id,
        'Work',
        new.id,
        0,
        NOW(),
        NOW()
    );
    
    -- Insert Personal board (position 1)
    INSERT INTO public.boards (id, name, user_id, position, created_at, updated_at)
    VALUES (
        personal_board_id,
        'Personal',
        new.id,
        1,
        NOW(),
        NOW()
    );
    
    -- Insert Home board (position 2)
    INSERT INTO public.boards (id, name, user_id, position, created_at, updated_at)
    VALUES (
        home_board_id,
        'Home',
        new.id,
        2,
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
